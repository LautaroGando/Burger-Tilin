"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const recipeItemSchema = z.object({
  productId: z.string(),
  ingredientId: z.string(),
  quantity: z.coerce.number().min(0.0001, "La cantidad debe ser mayor a 0"),
});

export type RecipeItemFormValues = z.infer<typeof recipeItemSchema>;

export async function addIngredientToRecipe(data: RecipeItemFormValues) {
  try {
    const validated = recipeItemSchema.parse(data);

    await prisma.recipeItem.create({
      data: {
        productId: validated.productId,
        ingredientId: validated.ingredientId,
        quantity: validated.quantity,
      },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Error agregando ingrediente" };
  }
}

export async function removeIngredientFromRecipe(id: string) {
  try {
    await prisma.recipeItem.delete({
      where: { id },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Error eliminando ingrediente" };
  }
}

export async function getProductRecipe(productId: string) {
  try {
    return await prisma.recipeItem.findMany({
      where: { productId },
      include: {
        ingredient: true,
      },
    });
  } catch {
    return [];
  }
}
