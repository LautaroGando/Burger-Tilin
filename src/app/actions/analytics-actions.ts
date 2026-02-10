"use server";

import { prisma } from "@/lib/prisma";
import { Sale } from "@/lib/types";
import { getOptimalPurchaseList } from "./ingredient-actions";
import {
  getStartOfDayInArgentina,
  getStartOfMonthInArgentina,
} from "@/lib/utils";
import { normalizePlatformName } from "@/lib/constants";

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
    const firstDay = getStartOfMonthInArgentina(now);
    // For lastDay, we can just use the start of the next month and go back one day,
    // or just use gte: firstDay and simplify the query if we don't care about future data.
    // Let's keep it robust.
    const lastDay = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      0,
    );
    lastDay.setHours(23, 59, 59, 999);

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
      commissionMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);

    // Calculate Variable Costs (Ingredients used in these sales)
    let cogs = 0; // Cost of Goods Sold (Recipes)
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
    const productCostsMap: Record<string, number> = {};
    products.forEach((p) => {
      const cost = p.recipe.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.ingredient.cost),
        0,
      );
      productCostsMap[p.id] = cost;
    });

    sales.forEach((sale) => {
      // Calculate Commission: Use "frozen" if discount < 0, otherwise dynamic
      let commRate = 0;
      if (Number(sale.discount) < 0) {
        const frozenRate = Math.abs(Number(sale.discount)) / 100;
        // Sanity Check: If frozen rate is > 50%, it's likely an error. Use current platform rate.
        if (frozenRate > 0.5) {
          commRate = commissionMap[normalizePlatformName(sale.channel)] ?? 0;
        } else {
          commRate = frozenRate;
        }
      } else {
        commRate = commissionMap[normalizePlatformName(sale.channel)] ?? 0;
      }
      totalCommissions += Number(sale.total) * commRate;

      sale.items.forEach((item) => {
        const cost = productCostsMap[item.productId] || 0;
        cogs += cost * item.quantity;
      });
    });

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

    // 3. Simplified Break-even (Coverage Model)
    // The user wants: "Net Sales vs Total Manual Expenses"
    const netSales = totalSales - totalCommissions;
    const totalExpenses = fixedCosts + extraVariableCosts;

    // The target is simply to reach the total amount spent
    const breakEvenPoint = totalExpenses;

    // Progress is how much of the total expenses have been covered by Net Sales
    const progress =
      breakEvenPoint > 0
        ? (netSales / breakEvenPoint) * 100
        : netSales > 0
          ? 100
          : 0;

    // Gross margin for context in other dashboard parts
    const grossMargin = netSales - cogs - totalWastage;
    const contributionMarginRatio = netSales > 0 ? grossMargin / netSales : 0;

    return {
      success: true,
      data: {
        fixedCosts: totalExpenses, // Use this for "Total Gastos" in UI
        variableCosts: cogs,
        totalSales: netSales,
        grossMargin,
        contributionMarginRatio,
        breakEvenPoint,
        progress: Math.min(progress, 150),
        hasActivity:
          netSales > 0 || totalExpenses > 0 || cogs > 0 || totalWastage > 0,
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
      startDate = getStartOfDayInArgentina(now);
    } else if (filter === "week") {
      // Use Argentina time to determine the start of the week (Monday)
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
        weekday: "narrow",
      });
      const dayName = formatter.format(now); // e.g., "M", "T"

      const argMidnight = getStartOfDayInArgentina(now);
      const day = now.getDay(); // This is server-local, might be off.
      // Better: get day of week in Argentina
      const argDay = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
          day: "numeric",
        }).format(now),
      );

      // Let's use a simpler approach for week: subtract days from start of today in Argentina
      const dayOfWeek = (now.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6 (Server might still be off)

      // I'll trust getStartOfDayInArgentina and then adjust
      startDate = new Date(argMidnight);
      const currentDay = startDate.getDay();
      const diff =
        startDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      startDate.setDate(diff);
    } else if (filter === "month") {
      startDate = getStartOfMonthInArgentina(now);
    } else if (filter === "year") {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
      }).formatToParts(now);
      const year = parts.find((p) => p.type === "year")?.value;
      startDate = new Date(`${year}-01-01T00:00:00Z`); // This is not perfect because of the T00:00:00Z
      // Actually, since we compare with gte, being slightly before the start of year in Argentina is fine
      // as long as we don't include previous year's sales.
      // But let's be precise:
      startDate = new Date(parseInt(year!), 0, 1);
      startDate.setHours(0, 0, 0, 0); // Still local.
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
        // For daily sorting within a week/month, we use the start of the day in ARG as sortKey
        sortKey = getStartOfDayInArgentina(d).getTime();
      } else if (filter === "year" || filter === "all") {
        // Group by Month
        const parts = new Intl.DateTimeFormat("es-AR", {
          month: "numeric",
          year: "numeric",
          timeZone: "America/Argentina/Buenos_Aires",
        }).formatToParts(d);
        const month = parseInt(
          parts.find((p) => p.type === "month")?.value || "0",
        );
        const year = parseInt(
          parts.find((p) => p.type === "year")?.value || "0",
        );

        key = d.toLocaleDateString("es-AR", {
          month: "long",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        sortKey = year * 12 + month;
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
      commMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
    });

    sales.forEach((s) => {
      const saleNet = Number(s.total);
      totalRevenue += saleNet;

      // Calculate Commission: Use "frozen" if discount < 0, otherwise dynamic
      let commRate = 0;
      if (Number(s.discount) < 0) {
        const frozenRate = Math.abs(Number(s.discount)) / 100;
        // Sanity Check: if > 50%, fallback to dynamic
        if (frozenRate > 0.5) {
          commRate = commMap[normalizePlatformName(s.channel)] ?? 0;
        } else {
          commRate = frozenRate;
        }
      } else {
        commRate = commMap[normalizePlatformName(s.channel)] ?? 0;
      }
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
  healthBreakdown: {
    margin: { score: number; value: number; max: number; target: number };
    stock: {
      score: number;
      value: number;
      max: number;
      totalIngredients: number;
      lowStockCount: number;
    };
    volume: { score: number; value: number; max: number; target: number };
  };
};

export async function getAdvancedAnalytics(): Promise<{
  success: boolean;
  data?: AdvancedAnalytics;
}> {
  try {
    const now = new Date();
    // Start of today in Argentina minus 30 days
    const thirtyDaysAgo = getStartOfDayInArgentina(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      commMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
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

      // Calculate Commission: Use "frozen" if discount < 0, otherwise dynamic
      let commRate = 0;
      if (Number(sale.discount) < 0) {
        const frozenRate = Math.abs(Number(sale.discount)) / 100;
        // Sanity Check: If frozen rate is > 50% (e.g. 67%), it's likely an error. Use current platform rate.
        if (frozenRate > 0.5) {
          commRate = commMap[normalizePlatformName(sale.channel)] ?? 0;
        } else {
          commRate = frozenRate;
        }
      } else {
        commRate = commMap[normalizePlatformName(sale.channel)] ?? 0;
      }
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
        healthBreakdown: {
          margin: {
            score: marginComponent,
            value: overallMargin,
            max: 40,
            target: 40,
          },
          stock: {
            score: stockComponent,
            value: stockHealth * 100,
            max: 30,
            totalIngredients,
            lowStockCount: lowStockIngredients,
          },
          volume: {
            score: volumeComponent,
            value: salesPerDay,
            max: 30,
            target: 10,
          },
        },
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
      commMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
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

    // 1. Fetch Sales (last 30 days)
    const sales = await prisma.sale.findMany({
      where: { date: { gte: thirtyDaysAgo }, status: "COMPLETED" },
    });

    // 2. Load Platform Configs for Commission Calculation
    const platformConfigs = await prisma.$queryRawUnsafe<
      PlatformConfigResult[]
    >('SELECT name, commission FROM "PlatformConfig"');
    const commMap: Record<string, number> = {};
    platformConfigs.forEach((c) => {
      commMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
    });

    // 3. Group Sales into Active Days
    // Format: YYYY-MM-DD using Argentina Timezone
    const daysMap: Record<string, { netIncome: number; orders: number }> = {};

    sales.forEach((s) => {
      const d = new Date(s.date);
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);

      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      const dateKey = `${year}-${month}-${day}`;

      const total = Number(s.total);

      // Commission Logic
      let commissionRate = 0;
      if (Number(s.discount) < 0) {
        commissionRate = Math.abs(Number(s.discount)) / 100;
      } else {
        commissionRate = commMap[s.channel.toUpperCase()] ?? 0;
      }
      const net = total * (1 - commissionRate);

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = { netIncome: 0, orders: 0 };
      }
      daysMap[dateKey].netIncome += net;
      daysMap[dateKey].orders += 1;
    });

    // Sort active days chronologically (newest first)
    const activeDays = Object.entries(daysMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));

    let avgDailyIncome = 0;

    if (activeDays.length > 0) {
      // 4. Weighted Average Calculation
      // We give 70% weight to the most recent 7 active days
      // and 30% to the rest of the month.
      const recentCount = 7;
      const recentDays = activeDays.slice(0, recentCount);
      const olderDays = activeDays.slice(recentCount);

      const calcMetrics = (subset: typeof activeDays) => {
        if (subset.length === 0)
          return { avgNet: 0, avgOrders: 0, avgTicket: 0 };
        const totalNet = subset.reduce((sum, d) => sum + d.netIncome, 0);
        const totalOrders = subset.reduce((sum, d) => sum + d.orders, 0);
        return {
          avgNet: totalNet / subset.length,
          avgOrders: totalOrders / subset.length,
          avgTicket: totalOrders > 0 ? totalNet / totalOrders : 0,
        };
      };

      const recentMetrics = calcMetrics(recentDays);
      const olderMetrics = calcMetrics(olderDays);

      if (olderDays.length > 0) {
        // Ponderación: 70% reciente / 30% histórico
        const finalAvgOrders =
          recentMetrics.avgOrders * 0.7 + olderMetrics.avgOrders * 0.3;
        const finalAvgTicket =
          recentMetrics.avgTicket * 0.7 + olderMetrics.avgTicket * 0.3;
        avgDailyIncome = finalAvgOrders * finalAvgTicket;
      } else {
        // Not enough data for weighting, use simple average of available active days
        avgDailyIncome = recentMetrics.avgNet;
      }
    }

    // 5. Fixed Expenses (Daily) - Keep current logic but normalize to 30 days
    const fixedExpenses = await prisma.expense.findMany({
      where: { isFixed: true },
    });
    const monthlyFixed = fixedExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const dailyFixed = monthlyFixed / 30;

    // 6. Expected Procurement (from Smart Purchase)
    const purchaseRes = await getOptimalPurchaseList();
    let expectedProcurementCost = 0;
    if (purchaseRes.success && purchaseRes.data) {
      const ingredients = await prisma.ingredient.findMany();
      purchaseRes.data.forEach((s) => {
        const ing = ingredients.find((i) => i.id === s.id);
        if (ing) {
          expectedProcurementCost += s.suggestedPurchase * Number(ing.cost);
        }
      });
    }

    // 7. Forecast for next 7 days
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
