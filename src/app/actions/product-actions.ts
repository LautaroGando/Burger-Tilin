"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/schemas";
import { autoTrain } from "./ai-actions";
import { Product } from "@/lib/types";

export type ProductFormValues = z.infer<typeof productSchema>;

interface RawProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  priceApps: number | string | null;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  showPublic: number | boolean;
  isPromo: boolean;
  promoDiscount: number | string;
  isPromoApps: boolean;
  promoDiscountApps: number | string;
}

interface RawProductExtra {
  id: string;
  mainProductId: string;
  extraProductId: string;
}

export async function createProduct(data: ProductFormValues) {
  try {
    const {
      categoryId,
      showPublic: dataShowPublic,
      ...validated
    } = productSchema.parse(data);

    const created = await prisma.product.create({
      data: {
        ...validated,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
      select: { id: true },
    });

    // Update showPublic via raw SQL
    await prisma.$executeRawUnsafe(
      'UPDATE "Product" SET "showPublic" = $1 WHERE id = $2',
      dataShowPublic ?? true,
      created.id,
    );

    await autoTrain(
      `Nuevo producto agregado al menú: ${validated.name} con un precio de $${validated.price}.`,
      "product_update",
    );

    revalidatePath("/admin/products");
    return { success: true, id: created.id };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    const validatedData = productSchema.parse(data);
    const { categoryId, showPublic: dataShowPublic, ...rest } = validatedData;

    await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        category: categoryId
          ? { connect: { id: categoryId } }
          : { disconnect: true },
      },
    });

    await prisma.$executeRawUnsafe(
      'UPDATE "Product" SET "showPublic" = $1 WHERE id = $2',
      dataShowPublic ?? true,
      id,
    );

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return {
      success: false,
      error:
        "Error al actualizar el producto. Si el error persiste, reinicia el servidor (npm run dev).",
    };
  }
}

export async function getProducts(): Promise<{
  success: boolean;
  data: Product[];
  error?: string;
}> {
  try {
    const products = await prisma.$queryRawUnsafe<RawProduct[]>(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p."priceApps",
        p."categoryId",
        p."isActive",
        p."showPublic",
        p."isPromo",
        p."promoDiscount",
        p."isPromoApps",
        p."promoDiscountApps",
        c.name as "categoryName",
        c.id as "categoryId"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      ORDER BY p."createdAt" DESC
    `);

    // Fetch recipes separately as they are complex to join raw and serialize
    const recipes = await prisma.recipeItem.findMany({
      include: { ingredient: true },
    });

    // Fetch allowed extras mapping
    const extrasMapping = await prisma.$queryRawUnsafe<RawProductExtra[]>(
      'SELECT * FROM "ProductExtra"',
    );

    // Fetch combo slots
    const comboSlots = await prisma.comboSlot.findMany();

    const serializedProducts = products.map((product) => {
      const productRecipes = recipes.filter((r) => r.productId === product.id);
      const productExtras = extrasMapping.filter(
        (ex) => ex.mainProductId === product.id,
      );
      const productComboSlots = comboSlots.filter(
        (slot) => slot.comboId === product.id
      );

      return {
        ...product,
        price: Number(product.price),
        priceApps: product.priceApps ? Number(product.priceApps) : null,
        promoDiscount: Number(product.promoDiscount || 0),
        promoDiscountApps: Number(product.promoDiscountApps || 0),
        isPromoApps: !!product.isPromoApps,
        showPublic: !!product.showPublic,
        category: product.categoryId
          ? {
              id: product.categoryId,
              name: product.categoryName as string,
            }
          : null,
        recipe: productRecipes.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          ingredient: {
            ...item.ingredient,
            cost: Number(item.ingredient.cost),
            stock: Number(item.ingredient.stock),
            minStock: Number(item.ingredient.minStock),
          },
        })),
        allowedExtras: productExtras,
        comboSlots: productComboSlots,
      };
    });

    return { success: true, data: serializedProducts as unknown as Product[] };
  } catch (error) {
    console.error("Failed to get products:", error);
    return { success: false, error: "Error al obtener productos", data: [] };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Check if product was sold
    const wasSold = await prisma.saleItem.findFirst({
      where: { productId: id },
    });

    if (wasSold) {
      return {
        success: false,
        error:
          "No se puede eliminar: tiene ventas asociadas. Podes marcarlo como inactivo.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete recipe items first
      await tx.recipeItem.deleteMany({ where: { productId: id } });
      // Delete the product
      await tx.product.delete({ where: { id } });
    });

    return { success: true };
  } catch (error) {
    console.error("Delete Product Error:", error);
    return { success: false, error: "Error al eliminar producto" };
  }
}

export async function updateProductExtras(
  mainProductId: string,
  extraProductIds: string[],
) {
  try {
    await prisma.$executeRawUnsafe(
      'DELETE FROM "ProductExtra" WHERE "mainProductId" = $1',
      mainProductId,
    );

    for (const extraId of extraProductIds) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "ProductExtra" (id, "mainProductId", "extraProductId") VALUES ($1, $2, $3)',
        crypto.randomUUID(),
        mainProductId,
        extraId,
      );
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Update Extras Error:", error);
    return { success: false, error: "Error al actualizar los extras" };
  }
}

// ── Inline price edit ────────────────────────────────────────────────────────
export async function updateProductPrice(id: string, price: number) {
  try {
    await prisma.product.update({
      where: { id },
      data: { price },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Update Price Error:", error);
    return { success: false, error: "Error al actualizar precio" };
  }
}

// ── Bulk toggle active/inactive ──────────────────────────────────────────────
export async function bulkToggleProducts(ids: string[], isActive: boolean) {
  try {
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Bulk Toggle Error:", error);
    return { success: false, error: "Error al actualizar productos" };
  }
}

// ── Bulk apply promo to selected products ─────────────────────────────────────
export async function bulkApplyPromo(
  ids: string[],
  discount: number,
  enable: boolean,
  target: "LOCAL" | "APPS" | "BOTH" = "BOTH"
) {
  try {
    const data: any = {};
    if (target === "LOCAL" || target === "BOTH") {
      data.isPromo = enable;
      data.promoDiscount = discount;
    }
    if (target === "APPS" || target === "BOTH") {
      data.isPromoApps = enable;
      data.promoDiscountApps = discount;
    }

    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data,
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Bulk Promo Error:", error);
    return { success: false, error: "Error al aplicar promoción" };
  }
}

// ── Apply promo to ALL products in a category ─────────────────────────────────
export async function bulkApplyPromoByCategory(
  categoryId: string | "ALL",
  discount: number,
  enable: boolean,
  target: "LOCAL" | "APPS" | "BOTH" = "BOTH"
) {
  try {
    const where = categoryId === "ALL" ? {} : { categoryId };
    const data: any = {};
    if (target === "LOCAL" || target === "BOTH") {
      data.isPromo = enable;
      data.promoDiscount = discount;
    }
    if (target === "APPS" || target === "BOTH") {
      data.isPromoApps = enable;
      data.promoDiscountApps = discount;
    }

    await prisma.product.updateMany({
      where,
      data,
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Bulk Promo By Category Error:", error);
    return { success: false, error: "Error al aplicar promoción por categoría" };
  }
}

// ── Remove all active promos ──────────────────────────────────────────────────
export async function removeAllPromos(target: "LOCAL" | "APPS" | "BOTH" = "BOTH") {
  try {
    const data: any = {};
    if (target === "LOCAL" || target === "BOTH") {
      data.isPromo = false;
      data.promoDiscount = 0;
    }
    if (target === "APPS" || target === "BOTH") {
      data.isPromoApps = false;
      data.promoDiscountApps = 0;
    }

    const OR = [];
    if (target === "LOCAL" || target === "BOTH") OR.push({ isPromo: true });
    if (target === "APPS" || target === "BOTH") OR.push({ isPromoApps: true });

    await prisma.product.updateMany({
      where: { OR },
      data,
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Remove All Promos Error:", error);
    return { success: false, error: "Error al quitar promociones" };
  }
}
