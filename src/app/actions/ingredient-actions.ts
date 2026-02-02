"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { autoTrain } from "./ai-actions";

import { ingredientSchema } from "@/lib/schemas";

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export async function createIngredient(data: IngredientFormValues) {
  try {
    const validated = ingredientSchema.parse(data);
    await prisma.ingredient.create({ data: validated });
    await autoTrain(
      `Nuevo insumo agregado: ${validated.name} (${validated.unit}) - Costo: $${validated.cost}`,
      "ingredient_update",
    );
    revalidatePath("/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Error agregando insumo" };
  }
}

export async function updateIngredient(id: string, data: IngredientFormValues) {
  try {
    const validated = ingredientSchema.parse(data);
    await prisma.ingredient.update({ where: { id }, data: validated });
    await autoTrain(
      `Insumo actualizado: ${validated.name} - Stock actual: ${validated.stock} ${validated.unit}`,
      "ingredient_update",
    );
    revalidatePath("/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Error actualizando insumo" };
  }
}

export async function getIngredients() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });

    return ingredients.map((ing) => ({
      ...ing,
      cost: Number(ing.cost),
      stock: Number(ing.stock),
      minStock: Number(ing.minStock),
    }));
  } catch {
    return [];
  }
}

export async function deleteIngredient(id: string) {
  try {
    // Check if ingredient is used in recipes
    const used = await prisma.recipeItem.findFirst({
      where: { ingredientId: id },
    });
    if (used) {
      return {
        success: false,
        error: "No se puede eliminar: está en uso en una receta",
      };
    }

    await prisma.ingredient.delete({ where: { id } });
    revalidatePath("/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Error eliminando insumo" };
  }
}

export async function getLowStockAlerts() {
  try {
    const lowStockIngredients = await prisma.ingredient.count({
      where: {
        stock: {
          lte: prisma.ingredient.fields.minStock,
        },
      },
    });
    return lowStockIngredients;
  } catch {
    return 0;
  }
}
