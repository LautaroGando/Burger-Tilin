"use server";

import { prisma } from "@/lib/prisma";
import { Sale } from "@/lib/types";
import { getOptimalPurchaseList } from "./ingredient-actions";

interface PlatformConfigResult {
  name: string;
  commission: number;
}

export type BreakEvenData = {
  fixedCosts: number;
  variableCosts: number;
  totalSales: number;
  grossMargin: number; // (Sales - Variable)
  contributionMarginRatio: number; // Margin / Sales
  breakEvenPoint: number; // Fixed / Ratio
  progress: number; // Sales / BreakEven * 100
  hasActivity: boolean;
  wastage: number;
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

    // Get platform commissions via raw SQL to avoid stale client issues
    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commissionMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commissionMap[c.name] = (c.commission || 0) / 100;
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
      // Calculate dynamic Commission
      const commRate = commissionMap[sale.channel.toUpperCase()] ?? 0;
      totalCommissions += Number(sale.total) * commRate;

      sale.items.forEach((item) => {
        const cost = productCosts[item.productId] || 0;
        variableCosts += cost * item.quantity;
      });
    });

    // Add variable expenses from DB (not related to recipes)
    variableCosts += extraVariableCosts;

    // 2.5. Get Wastage
    const wastageLogs = await prisma.wasteLog.findMany({
      where: {
        date: { gte: firstDay, lte: lastDay },
      },
    });
    const totalWastage = wastageLogs.reduce(
      (sum, w) => sum + Number(w.cost),
      0,
    );

    // 3. Calculate Break-even
    const netSales = totalSales - totalCommissions;
    const grossMargin = netSales - variableCosts - totalWastage;
    const contributionMarginRatio = netSales > 0 ? grossMargin / netSales : 0;

    // 3. Calculate Break-even (Cost Recovery Model)
    // The user wants to see how much they need to sell to COVER everything spent.
    // Meta = Fixed + Variable (All costs incurred so far)
    const breakEvenPoint = fixedCosts + variableCosts;

    // Progress is how much of those total costs have been recovered by Net Sales
    const progress = breakEvenPoint > 0 ? (netSales / breakEvenPoint) * 100 : 0;

    return {
      success: true,
      data: {
        fixedCosts,
        variableCosts,
        totalSales: netSales, // Using Net Sales here for a more realistic dashboard
        grossMargin,
        contributionMarginRatio,
        breakEvenPoint: netSales === 0 && fixedCosts === 0 ? 0 : breakEvenPoint,
        progress: netSales === 0 && fixedCosts === 0 ? 0 : progress,
        hasActivity:
          netSales > 0 ||
          fixedCosts > 0 ||
          variableCosts > 0 ||
          totalWastage > 0,
        wastage: totalWastage,
      },
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    return { success: false };
  }
}

export type SalesHistoryFilter = "day" | "week" | "month" | "year" | "all";

export async function getSalesHistory(filter: SalesHistoryFilter): Promise<{
  success: boolean;
  sales: Sale[];
  chartData: { name: string; value: number }[];
  totalRevenue: number;
  totalNetRevenue: number;
  estimatedProfit: number;
  totalCommissions: number;
  totalCount: number;
  commMap?: Record<string, number>;
  error?: string;
}> {
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
    const chartDataMap: Record<
      string,
      { value: number; sortKey: string | number }
    > = {};

    sales.forEach((sale) => {
      const d = new Date(sale.date);
      let key = "";
      let sortKey: string | number = d.getTime();

      if (filter === "day") {
        // Group by Hour (10:00, 11:00) using Argentina Timezone
        const hour = new Intl.DateTimeFormat("es-AR", {
          hour: "numeric",
          hour12: false,
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(d);
        key = `${hour}:00`;
        sortKey = parseInt(hour);
      } else if (filter === "week" || filter === "month") {
        // Group by Day (Mon, Tue OR 1, 2)
        key = d.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        // For daily sorting within a week/month, we use the start of the day as sortKey
        const dayCopy = new Date(d);
        dayCopy.setHours(0, 0, 0, 0);
        sortKey = dayCopy.getTime();
      } else if (filter === "year" || filter === "all") {
        // Group by Month
        key = d.toLocaleDateString("es-AR", {
          month: "long",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        sortKey = d.getFullYear() * 12 + d.getMonth();
      }

      const existing = chartDataMap[key] || { value: 0, sortKey };
      chartDataMap[key] = {
        value: existing.value + Number(sale.total),
        sortKey: existing.sortKey,
      };
    });

    // Format for Recharts and Sort Chronologically
    const chartData = Object.entries(chartDataMap)
      .map(([name, data]) => ({
        name,
        value: data.value,
        sortKey: data.sortKey,
      }))
      .sort((a, b) => {
        if (typeof a.sortKey === "number" && typeof b.sortKey === "number") {
          return a.sortKey - b.sortKey;
        }
        return String(a.sortKey).localeCompare(String(b.sortKey));
      })
      .map(({ name, value }) => ({ name, value }));

    // Calculate totals for the period
    let totalRevenue = 0;
    let totalCommissions = 0;
    let totalCosts = 0;

    // Fetch product costs
    const productsForCost = await prisma.product.findMany({
      include: {
        recipe: {
          include: { ingredient: true },
        },
      },
    });

    const productCostMap: Record<string, number> = {};
    productsForCost.forEach((p) => {
      productCostMap[p.id] = p.recipe.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.ingredient.cost),
        0,
      );
    });

    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commMap[c.name] = (c.commission || 0) / 100;
    });

    sales.forEach((s) => {
      const saleNet = Number(s.total);
      totalRevenue += saleNet;

      const commRate = commMap[s.channel.toUpperCase()] ?? 0;
      totalCommissions += saleNet * commRate;

      s.items.forEach((item) => {
        totalCosts += (productCostMap[item.productId] || 0) * item.quantity;
      });
    });

    const totalNetRevenue = totalRevenue - totalCommissions;
    const estimatedProfit = totalRevenue - totalCommissions - totalCosts;
    const totalCount = sales.length;

    // Serialize Sales (Decimal to Number)
    const serializedSales = sales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      discount: Number(sale.discount || 0),
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
          pricePedidosYa: item.product.pricePedidosYa
            ? Number(item.product.pricePedidosYa)
            : null,
          priceRappi: item.product.priceRappi
            ? Number(item.product.priceRappi)
            : null,
          priceMP: item.product.priceMP ? Number(item.product.priceMP) : null,
          promoDiscount: Number(item.product.promoDiscount || 0),
          promoDiscountPY: Number(item.product.promoDiscountPY || 0),
          promoDiscountRappi: Number(item.product.promoDiscountRappi || 0),
          promoDiscountMP: Number(item.product.promoDiscountMP || 0),
        },
      })),
    }));

    return {
      success: true,
      sales: serializedSales as unknown as Sale[],
      chartData,
      totalRevenue,
      totalNetRevenue,
      estimatedProfit,
      totalCommissions,
      totalCount,
      commMap,
    };
  } catch (error) {
    console.error("Sales History Error:", error);
    return {
      success: false,
      sales: [],
      chartData: [],
      totalRevenue: 0,
      totalNetRevenue: 0,
      estimatedProfit: 0,
      totalCommissions: 0,
      totalCount: 0,
    };
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
  topIngredients: { name: string; stockValue: number }[];
  salesProjection: number;
  customerRecurrence: number;
  totalSales: number;
  totalWastage: number;
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
        status: { in: ["COMPLETED", "PENDING"] },
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
    let totalGrossRevenue = 0;
    let totalProfit = 0;

    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commMap[c.name] = (c.commission || 0) / 100;
    });

    sales.forEach((sale) => {
      // Peak Hours using Argentina timezone
      const d = new Date(sale.date);
      const hourStr = new Intl.DateTimeFormat("es-AR", {
        hour: "numeric",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(d);
      const hour = parseInt(hourStr);
      hourMap[hour] = (hourMap[hour] || 0) + 1;

      // Revenue & Commission
      const saleTotal = Number(sale.total);

      const commRate = commMap[sale.channel.toUpperCase()] ?? 0;
      const saleCommission = saleTotal * commRate;

      totalGrossRevenue += saleTotal;

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
      totalGrossRevenue > 0 ? (totalProfit / totalGrossRevenue) * 100 : 0;
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

    // 6. Improved Customer Recurrence Calculation
    // We group sales by identifier (customerId or normalized clientName)
    // We exclude generic names usually used for anonymous sales
    const GENERIC_NAMES = [
      "mostrador",
      "whatsapp",
      "pedidosya",
      "rappi",
      "cliente",
      "desconocido",
      "anonimo",
      "pya",
    ];

    const customerSalesMap: Record<string, number> = {};

    sales.forEach((sale) => {
      let identifier: string | null = null;

      if (sale.customerId) {
        identifier = `id_${sale.customerId}`;
      } else if (sale.clientName) {
        const name = sale.clientName.trim().toLowerCase();
        // Only use name as identifier if it's not empty and not generic
        if (name && !GENERIC_NAMES.includes(name)) {
          identifier = `name_${name}`;
        }
      }

      if (identifier) {
        customerSalesMap[identifier] = (customerSalesMap[identifier] || 0) + 1;
      }
    });

    // The recurrence metric here represents:
    // "What % of orders in the last 30 days are from repeat customers?"
    const repeatOrdersCount = Object.values(customerSalesMap).reduce(
      (sum, count) => {
        if (count > 1) return sum + count;
        return sum;
      },
      0,
    );

    const customerRecurrence =
      sales.length > 0 ? (repeatOrdersCount / sales.length) * 100 : 0;

    // 7. Wastage
    const wastageLogs30 = await prisma.wasteLog.findMany({
      where: { date: { gte: thirtyDaysAgo } },
    });
    const totalWastage = wastageLogs30.reduce(
      (sum, w) => sum + Number(w.cost),
      0,
    );

    // 8. Top Valuable Ingredients
    const dbIngredients = await prisma.ingredient.findMany();
    const topIngredients = dbIngredients
      .map((ing) => ({
        name: ing.name,
        stockValue: Number(ing.cost) * Number(ing.stock),
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 5);

    // 9. Sales Projection (Revenue Base)
    // We project the next 30 days based on the last 30 days performance
    const salesProjection = totalGrossRevenue;

    return {
      success: true,
      data: {
        healthScore,
        peakHours,
        topProducts,
        topIngredients,
        salesProjection,
        customerRecurrence,
        totalSales: sales.length,
        totalWastage,
      },
    };
  } catch (error) {
    console.error("Advanced Analytics Error:", error);
    return { success: false };
  }
}

export async function getRealTimeProfitability() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        recipe: {
          include: { ingredient: true },
        },
      },
    });

    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commMap[c.name] = (c.commission || 0) / 100;
    });

    const profitability = products
      .map((p) => {
        const cost = p.recipe.reduce(
          (sum, item) =>
            sum + Number(item.quantity) * Number(item.ingredient.cost),
          0,
        );

        const price = Number(p.price);
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

        // Calculate platform margins too
        const pYaPrice = Number(p.pricePedidosYa) || price;
        const rappiPrice = Number(p.priceRappi) || price;
        const mpPrice = Number(p.priceMP) || price;

        const pYaComm = commMap["PEYA"] ?? 0;
        const rappiComm = commMap["RAPPI"] ?? 0;
        const mpComm = commMap["MERCADOPAGO"] ?? 0;

        const pYaMargin =
          pYaPrice > 0
            ? ((pYaPrice * (1 - pYaComm) - cost) / (pYaPrice * (1 - pYaComm))) *
              100
            : 0;
        const rappiMargin =
          rappiPrice > 0
            ? ((rappiPrice * (1 - rappiComm) - cost) /
                (rappiPrice * (1 - rappiComm))) *
              100
            : 0;
        const mpMargin =
          mpPrice > 0
            ? ((mpPrice * (1 - mpComm) - cost) / (mpPrice * (1 - mpComm))) * 100
            : 0;

        return {
          id: p.id,
          name: p.name,
          category: p.category?.name || "Sin categoría",
          cost,
          price,
          margin,
          pYaMargin,
          rappiMargin,
          mpMargin,
          isCritical:
            margin < 25 || pYaMargin < 15 || rappiMargin < 15 || mpMargin < 15,
        };
      })
      .sort((a, b) => a.margin - b.margin);

    return { success: true, data: profitability };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error calculando rentabilidad" };
  }
}

export async function getCashFlowForecast() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Average Daily Income (Net)
    const sales = await prisma.sale.findMany({
      where: { date: { gte: thirtyDaysAgo }, status: "COMPLETED" },
    });

    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commMap[c.name] = (c.commission || 0) / 100;
    });

    const totalNetRevenue = sales.reduce((sum, s) => {
      const total = Number(s.total);
      const commissionRate = commMap[s.channel.toUpperCase()] ?? 0;
      const commission = total * commissionRate;
      return sum + (total - commission);
    }, 0);

    const avgDailyIncome = totalNetRevenue / 30;

    // 2. Fixed Expenses (Daily)
    const fixedExpenses = await prisma.expense.findMany({
      where: { isFixed: true },
    });
    const monthlyFixed = fixedExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const dailyFixed = monthlyFixed / 30;

    // 3. Expected Procurement (from Smart Purchase)
    const purchaseRes = await getOptimalPurchaseList();
    let expectedProcurementCost = 0;
    if (purchaseRes.success && purchaseRes.data) {
      // Estimate cost based on current ingredient costs
      const ingredients = await prisma.ingredient.findMany();
      purchaseRes.data.forEach((s) => {
        const ing = ingredients.find((i) => i.id === s.id);
        if (ing) {
          expectedProcurementCost += s.suggestedPurchase * Number(ing.cost);
        }
      });
    }

    // 4. Forecast for next 7 days
    const days = 7;
    const projectedIncome = avgDailyIncome * days;
    const projectedFixedExpenses = dailyFixed * days;
    const netCashFlow =
      projectedIncome - projectedFixedExpenses - expectedProcurementCost;

    return {
      success: true,
      data: {
        avgDailyIncome,
        dailyFixed,
        expectedProcurementCost,
        projectedIncome,
        projectedFixedExpenses,
        netCashFlow,
        days,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error proyectando flujo de caja" };
  }
}
