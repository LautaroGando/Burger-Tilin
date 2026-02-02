"use server";

import { prisma } from "@/lib/prisma";

export type StockPrediction = {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  avgDailyConsumption: number;
  daysRemaining: number;
  projectedDepletionDate: Date | null;
  status: "CRITICAL" | "WARNING" | "SAFE" | "UNKNOWN";
};

export async function getStockPredictions(): Promise<{
  success: boolean;
  data?: StockPrediction[];
}> {
  try {
    // 1. Define time window (Last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 2. Fetch Sales in window
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
      include: {
        items: true,
      },
    });

    if (sales.length === 0) {
      return { success: true, data: [] }; // No data to predict
    }

    // 3. Fetch Products & Recipes to calculate usage
    const products = await prisma.product.findMany({
      include: {
        recipe: true,
      },
    });

    const ingredients = await prisma.ingredient.findMany();

    // 4. Calculate Total Consumption per Ingredient
    const consumptionMap: Record<string, number> = {}; // ingredientId -> totalQty

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.recipe) {
          product.recipe.forEach((recipeItem) => {
            const usage = Number(recipeItem.quantity) * item.quantity;
            if (!consumptionMap[recipeItem.ingredientId]) {
              consumptionMap[recipeItem.ingredientId] = 0;
            }
            consumptionMap[recipeItem.ingredientId] += usage;
          });
        }
      });
    });

    // 5. Calculate Predictions
    // Calculate actual days passed since first sale in window (to avoid diluting avg if we only have 2 days of data)
    const firstSaleDate =
      sales.length > 0
        ? sales.reduce((min, s) => (s.date < min ? s.date : min), sales[0].date)
        : thirtyDaysAgo;

    const timeDiff = Math.abs(now.getTime() - firstSaleDate.getTime());
    const daysActive = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1; // Avoid division by zero, at least 1 day

    const predictions: StockPrediction[] = ingredients.map((ing) => {
      const totalUsed = consumptionMap[ing.id] || 0;
      const avgDaily = totalUsed / daysActive;
      const currentStock = Number(ing.stock);

      let daysRemaining = avgDaily > 0 ? currentStock / avgDaily : 999;
      // Cap at 999 for "Infinite"
      if (daysRemaining > 999) daysRemaining = 999;

      let status: StockPrediction["status"] = "SAFE";
      if (daysRemaining < 3) status = "CRITICAL";
      else if (daysRemaining < 7) status = "WARNING";
      else if (avgDaily === 0 && currentStock === 0) status = "UNKNOWN"; // No usage, no stock

      const projectedDate =
        avgDaily > 0
          ? new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000)
          : null;

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        currentStock,
        avgDailyConsumption: avgDaily,
        daysRemaining,
        projectedDepletionDate: projectedDate,
        status,
      };
    });

    // Sort by urgency (Critical first)
    predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return { success: true, data: predictions };
  } catch (error) {
    console.error("Prediction Error:", error);
    return { success: false, data: [] };
  }
}
