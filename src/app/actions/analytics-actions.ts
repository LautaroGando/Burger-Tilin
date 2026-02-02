"use server";

import { prisma } from "@/lib/prisma";

export type BreakEvenData = {
  fixedCosts: number;
  variableCosts: number;
  totalSales: number;
  grossMargin: number; // (Sales - Variable)
  contributionMarginRatio: number; // Margin / Sales
  breakEvenPoint: number; // Fixed / Ratio
  progress: number; // Sales / BreakEven * 100
  hasActivity: boolean;
};

export async function getBreakEvenAnalysis(): Promise<{
  success: boolean;
  data?: BreakEvenData;
}> {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Get All Monthly Expenses
    const dbExpenses = await prisma.expense.findMany({
      where: {
        date: { gte: firstDay, lte: lastDay },
      },
    });

    const fixedCosts = dbExpenses
      .filter((e) => e.isFixed)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const extraVariableCosts = dbExpenses
      .filter((e) => !e.isFixed)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // 2. Get Sales & COGS (Variable Costs)
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: firstDay, lte: lastDay },
        status: "COMPLETED",
      },
      include: {
        items: true, // we need items to calculate total cost if we stored it,
        // BUT wait, we don't store historical cost in SaleItem yet?
        // Let's check schema. We have unitPrice. We need 'cost' or calculate it via recipe.
        // For accurate history, we should have stored 'cost' at sale time.
        // If not, we estimate with CURRENT recipe cost.
        // Given MVP, let's estimate with current product cost.
      },
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);

    // Calculate Variable Costs (Ingredients used in these sales)
    let variableCosts = 0;
    let totalCommissions = 0;

    // We need to fetch all product costs first to avoid N+1
    const products = await prisma.product.findMany({
      include: {
        recipe: {
          include: { ingredient: true },
        },
      },
    });

    // Map product ID to its cost
    const productCosts: Record<string, number> = {};
    products.forEach((p) => {
      const cost = p.recipe.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.ingredient.cost),
        0,
      );
      productCosts[p.id] = cost;
    });

    sales.forEach((sale) => {
      // Calculate Commission
      if (["RAPPI", "PEYA", "MERCADOPAGO"].includes(sale.channel)) {
        totalCommissions += Number(sale.total) * 0.35;
      }

      sale.items.forEach((item) => {
        const cost = productCosts[item.productId] || 0;
        variableCosts += cost * item.quantity;
      });
    });

    // Add variable expenses from DB (not related to recipes)
    variableCosts += extraVariableCosts;

    // 3. Calculate Break-even
    const grossMargin = totalSales - variableCosts - totalCommissions;
    const contributionMarginRatio =
      totalSales > 0 ? grossMargin / totalSales : 0;

    // Break-even Point = Fixed Costs / Ratio
    // If ratio is 0 or negative (losing money on every burger), break even is impossible (Infinity)
    let breakEvenPoint = 0;
    if (contributionMarginRatio > 0) {
      breakEvenPoint = fixedCosts / contributionMarginRatio;
    }

    const progress =
      breakEvenPoint > 0 ? (totalSales / breakEvenPoint) * 100 : 0;

    return {
      success: true,
      data: {
        fixedCosts,
        variableCosts,
        totalSales,
        grossMargin,
        contributionMarginRatio,
        breakEvenPoint:
          totalSales === 0 && fixedCosts === 0 ? 0 : breakEvenPoint,
        progress: totalSales === 0 && fixedCosts === 0 ? 0 : progress,
        hasActivity: totalSales > 0 || fixedCosts > 0 || variableCosts > 0,
      },
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    return { success: false };
  }
}

export type SalesHistoryFilter = "day" | "week" | "month" | "year" | "all";

export async function getSalesHistory(filter: SalesHistoryFilter) {
  try {
    const now = new Date();
    let startDate = new Date(0); // Epoch for "all"

    if (filter === "day") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (filter === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
        },
        status: { in: ["COMPLETED", "PENDING"] }, // Show pending too? Maybe. Usually history is completed. Let's show all valid.
      },
      orderBy: {
        date: "desc",
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    // Prepare Chart Data
    const chartDataMap: Record<string, number> = {};

    sales.forEach((sale) => {
      const d = new Date(sale.date);
      let key = "";

      if (filter === "day") {
        // Group by Hour (10:00, 11:00)
        key = `${d.getHours()}:00`;
      } else if (filter === "week" || filter === "month") {
        // Group by Day (Mon, Tue OR 1, 2)
        // Let's use Date string for sorting correctness
        key = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      } else if (filter === "year" || filter === "all") {
        // Group by Month
        key = d.toLocaleDateString("es-AR", { month: "long" });
      }

      chartDataMap[key] = (chartDataMap[key] || 0) + Number(sale.total);
    });

    // Format for Recharts
    // We might want to sort this if keys are not auto-sorted.
    // Map doesn't guarantee order if we just iterate keys.
    // For simplicity in MVP, let's just push.
    // For better UX, we might need to pre-fill 0s.
    const chartData = Object.entries(chartDataMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate totals for the period
    let totalRevenue = 0;
    let totalCommissions = 0;

    sales.forEach((s) => {
      const saleTotal = Number(s.total);
      totalRevenue += saleTotal;
      if (["RAPPI", "PEYA", "MERCADOPAGO"].includes(s.channel)) {
        totalCommissions += saleTotal * 0.35;
      }
    });

    const totalNetRevenue = totalRevenue - totalCommissions;
    const totalCount = sales.length;

    // Serialize Sales (Decimal to Number)
    const serializedSales = sales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      customer: sale.customer
        ? {
            ...sale.customer,
            totalSpent: Number(sale.customer.totalSpent),
          }
        : null,
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        product: {
          ...item.product,
          price: Number(item.product.price),
        },
      })),
    }));

    return {
      success: true,
      sales: serializedSales,
      chartData,
      totalRevenue,
      totalNetRevenue,
      totalCommissions,
      totalCount,
    };
  } catch (error) {
    console.error("Sales History Error:", error);
    return { success: false, sales: [], chartData: [] };
  }
}

export type ProductPerformance = {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
};

export type AdvancedAnalytics = {
  healthScore: number;
  peakHours: { hour: number; count: number }[];
  topProducts: ProductPerformance[];
  customerRecurrence: number;
  totalSales: number;
};

export async function getAdvancedAnalytics(): Promise<{
  success: boolean;
  data?: AdvancedAnalytics;
}> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 1. Fetch Sales (lightweight)
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
      include: {
        items: true,
      },
    });

    // 2. Fetch Products with Recipes for Cost & Name
    const products = await prisma.product.findMany({
      include: {
        recipe: {
          include: { ingredient: true },
        },
      },
    });

    // 3. Build Product Info Map (Cost & Name)
    const productInfoMap: Record<string, { cost: number; name: string }> = {};
    products.forEach((p) => {
      const cost = p.recipe.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.ingredient.cost),
        0,
      );
      productInfoMap[p.id] = { cost, name: p.name };
    });

    // 4. Calculate Metrics
    const hourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;

    const performanceMap: Record<string, ProductPerformance> = {};
    let totalRevenue = 0;
    let totalProfit = 0;

    sales.forEach((sale) => {
      // Peak Hours
      const hour = new Date(sale.date).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;

      // Revenue & Commission
      const saleTotal = Number(sale.total);
      let saleCommission = 0;
      if (["RAPPI", "PEYA", "MERCADOPAGO"].includes(sale.channel)) {
        saleCommission = saleTotal * 0.35;
      }

      totalRevenue += saleTotal - saleCommission;

      // Product Performance
      sale.items.forEach((item) => {
        const prodId = item.productId;
        const info = productInfoMap[prodId] || { cost: 0, name: "Desconocido" };

        const itemRevenue = Number(item.unitPrice) * item.quantity;
        // Apply proportional commission to item profit if applicable
        const commissionFactor = saleTotal > 0 ? saleCommission / saleTotal : 0;
        const itemCommission = itemRevenue * commissionFactor;

        const itemProfit =
          (Number(item.unitPrice) - info.cost) * item.quantity - itemCommission;

        totalProfit += itemProfit;

        if (!performanceMap[prodId]) {
          performanceMap[prodId] = {
            id: prodId,
            name: info.name,
            sales: 0,
            revenue: 0,
            profit: 0,
            margin: 0,
          };
        }
        performanceMap[prodId].sales += item.quantity;
        performanceMap[prodId].revenue += itemRevenue;
        performanceMap[prodId].profit += itemProfit;
      });
    });

    const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));

    // Convert map to array and sort
    const topProducts = Object.values(performanceMap)
      .map((p) => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit) // Sort by Profit
      .slice(0, 5);

    // 5. Business Health Score Calculation
    // Factors: Margin (40%), Volume (30%), Stock Alert Ratio (30%)
    const overallMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const marginComponent = Math.min(overallMargin / 40, 1) * 40; // Max 40 points

    // Stock health
    const totalIngredients = await prisma.ingredient.count();
    const lowStockIngredients = await prisma.ingredient.count({
      where: {
        stock: { lte: prisma.ingredient.fields.minStock },
      },
    });
    const stockHealth =
      totalIngredients > 0 ? 1 - lowStockIngredients / totalIngredients : 1;
    const stockComponent = stockHealth * 30;

    // Volume (Simplified baseline: 10 sales/day)
    const salesPerDay = sales.length / 30;
    const volumeComponent = Math.min(salesPerDay / 10, 1) * 30;

    // If no sales at all, the score should reflect total inactivity unless stock is perfect
    let healthScore = 0;
    if (sales.length > 0) {
      healthScore = Math.round(
        marginComponent + stockComponent + volumeComponent,
      );
    } else {
      // If no sales, health is 0 (Waiting for data)
      healthScore = 0;
    }

    // 6. Customer Recurrence
    // We already have 30-day sales in 'sales' array.
    // Count total sales and sales with customerId
    const recurrenceCount = sales.filter((s) => s.customerId).length;
    const customerRecurrence =
      sales.length > 0 ? (recurrenceCount / sales.length) * 100 : 0;

    return {
      success: true,
      data: {
        healthScore,
        peakHours,
        topProducts,
        customerRecurrence,
        totalSales: sales.length,
      },
    };
  } catch (error) {
    console.error("Advanced Analytics Error:", error);
    return { success: false };
  }
}
