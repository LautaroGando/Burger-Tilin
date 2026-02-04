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
  pricePedidosYa: number | string | null;
  priceRappi: number | string | null;
  priceMP: number | string | null;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  showPublic: number | boolean;
  isPromo: boolean;
  promoDiscount: number | string;
  isPromoPY: boolean;
  promoDiscountPY: number | string;
  isPromoRappi: boolean;
  promoDiscountRappi: number | string;
  isPromoMP: boolean;
  promoDiscountMP: number | string;
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
    // Destructure categoryId to handle it as a relation, not a direct field
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
    // If it's a Prisma error about unknown fields, it's likely the sync issue
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
        p.*,
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

    const serializedProducts = products.map((product) => {
      const productRecipes = recipes.filter((r) => r.productId === product.id);
      const productExtras = extrasMapping.filter(
        (ex) => ex.mainProductId === product.id,
      );

      return {
        ...product,
        price: Number(product.price),
        pricePedidosYa: product.pricePedidosYa
          ? Number(product.pricePedidosYa)
          : null,
        priceRappi: product.priceRappi ? Number(product.priceRappi) : null,
        priceMP: product.priceMP ? Number(product.priceMP) : null,
        promoDiscount: Number(product.promoDiscount || 0),
        promoDiscountPY: Number(product.promoDiscountPY || 0),
        promoDiscountRappi: Number(product.promoDiscountRappi || 0),
        promoDiscountMP: Number(product.promoDiscountMP || 0),
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
