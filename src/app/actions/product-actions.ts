"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Schema definition
// Schema definition
import { productSchema } from "@/lib/schemas";
import { autoTrain } from "./ai-actions";

export type ProductFormValues = z.infer<typeof productSchema>;

export async function createProduct(data: ProductFormValues) {
  try {
    const validated = productSchema.parse(data);

    await prisma.product.create({
      data: {
        ...validated,
        // Default values for required fields in schema that are not in form yet
        // In a real scenario we might upload an image
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
    const validated = productSchema.parse(data);
    await prisma.product.update({ where: { id }, data: validated });
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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

    return { success: true, data: serializedProducts };
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
