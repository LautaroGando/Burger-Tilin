"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { autoTrain } from "./ai-actions";

import { ingredientSchema } from "@/lib/schemas";
import { Ingredient } from "@/lib/types";

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export async function createIngredient(data: IngredientFormValues) {
  try {
    const validated = ingredientSchema.parse(data);
    await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.create({ data: validated });
      await tx.priceHistory.create({
        data: {
          ingredientId: ingredient.id,
          cost: validated.cost,
        },
      });
    });

    await autoTrain(
      `Nuevo insumo agregado: ${validated.name} (${validated.unit}) - Costo inicial: $${validated.cost}`,
      "ingredient_update",
    );
    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Error agregando insumo" };
  }
}

export async function updateIngredient(id: string, data: IngredientFormValues) {
  try {
    const validated = ingredientSchema.parse(data);

    // Check if price changed to log it
    const current = await prisma.ingredient.findUnique({ where: { id } });
    const priceChanged =
      current && Number(current.cost) !== Number(validated.cost);

    await prisma.$transaction(async (tx) => {
      await tx.ingredient.update({ where: { id }, data: validated });
      if (priceChanged) {
        await tx.priceHistory.create({
          data: {
            ingredientId: id,
            cost: validated.cost,
          },
        });
      }
    });

    await autoTrain(
      `Insumo actualizado: ${validated.name} - ${priceChanged ? `Nuevo costo: $${validated.cost}` : `Stock: ${validated.stock}`}`,
      "ingredient_update",
    );
    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Error actualizando insumo" };
  }
}

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });

    return ingredients.map((ing) => ({
      ...ing,
      cost: Number(ing.cost),
      stock: Number(ing.stock),
      minStock: Number(ing.minStock),
    })) as Ingredient[];
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

    await prisma.$transaction([
      prisma.priceHistory.deleteMany({ where: { ingredientId: id } }),
      prisma.wasteLog.deleteMany({ where: { ingredientId: id } }),
      prisma.ingredient.delete({ where: { id } }),
    ]);

    revalidatePath("/admin/ingredients");
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

export async function logWaste(data: {
  ingredientId: string;
  quantity: number;
  description: string;
}) {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: data.ingredientId },
    });

    if (!ingredient) throw new Error("Insumo no encontrado");

    const cost = Number(ingredient.cost) * data.quantity;

    // Transacción para asegurar consistencia
    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          stock: {
            decrement: data.quantity,
          },
        },
      }),
      prisma.wasteLog.create({
        data: {
          ingredientId: data.ingredientId,
          quantity: data.quantity,
          description: data.description,
          cost: cost,
          date: new Date(),
        },
      }),
    ]);

    await autoTrain(
      `Merma registrada: ${ingredient.name} (-${data.quantity} ${ingredient.unit}) - Motivo: ${data.description}`,
      "waste_log",
    );

    revalidatePath("/admin/ingredients");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error registrando merma" };
  }
}

export async function getPriceHistory(ingredientId: string) {
  try {
    const history = await prisma.priceHistory.findMany({
      where: { ingredientId },
      orderBy: { date: "desc" },
      take: 20,
    });
    return history.map((h) => ({ ...h, cost: Number(h.cost) }));
  } catch {
    return [];
  }
}

export async function getOptimalPurchaseList() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get all sales items from last 30 days
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    });

    // 2. Map Consumption
    const consumptionMap: Record<string, number> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        item.product.recipe.forEach((ri) => {
          const totalIngUsed = Number(ri.quantity) * item.quantity;
          consumptionMap[ri.ingredientId] =
            (consumptionMap[ri.ingredientId] || 0) + totalIngUsed;
        });
      });
    });

    // 3. Get current ingredients
    const ingredients = await prisma.ingredient.findMany();

    // 4. Calculate recommendations (Suggest for 7 days)
    const suggestions = ingredients
      .map((ing) => {
        const total30d = consumptionMap[ing.id] || 0;
        const dailyAvg = total30d / 30;
        const neededFor7d = dailyAvg * 7;

        const currentStock = Number(ing.stock);
        const deficit = neededFor7d - currentStock;

        // Also respect minStock
        const urgencyScore =
          currentStock <= Number(ing.minStock) ? 2 : deficit > 0 ? 1 : 0;

        return {
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          currentStock,
          dailyAvg,
          suggestedPurchase: deficit > 0 ? Math.ceil(deficit * 1.2) : 0, // 20% safety buffer
          urgencyScore,
        };
      })
      .filter((s) => s.suggestedPurchase > 0 || s.urgencyScore > 0)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    return { success: true, data: suggestions };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error calculando lista de compras" };
  }
}
