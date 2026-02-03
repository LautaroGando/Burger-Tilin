"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/schemas";
import { autoTrain } from "./ai-actions";
import { Product } from "@/lib/types";

export type ProductFormValues = z.infer<typeof productSchema>;

export async function createProduct(data: ProductFormValues) {
  try {
    const { categoryId, ...validated } = productSchema.parse(data);

    await prisma.product.create({
      data: {
        ...validated,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
    });

    await autoTrain(
      `Nuevo producto agregado al menú: ${validated.name} con un precio de $${validated.price}.`,
      "product_update",
    );

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    // Destructure categoryId to handle it as a relation, not a direct field
    const validatedData = productSchema.parse(data);
    const { categoryId, ...rest } = validatedData;

    await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        category: categoryId
          ? { connect: { id: categoryId } }
          : { disconnect: true },
      },
    });

    revalidatePath("/products");
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
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    const serializedProducts = products.map((product) => ({
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
      recipe: product.recipe.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        ingredient: {
          ...item.ingredient,
          cost: Number(item.ingredient.cost),
          stock: Number(item.ingredient.stock),
          minStock: Number(item.ingredient.minStock),
        },
      })),
    }));

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

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Delete Product Error:", error);
    return { success: false, error: "Error al eliminar producto" };
  }
}
