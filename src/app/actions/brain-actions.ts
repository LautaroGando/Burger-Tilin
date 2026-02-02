"use server";

import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "./sale-actions";

export type BrainContext = {
  dailyMetrics: {
    sales: number;
    orders: number;
    profit: number;
    margin: number;
  };
  lowStockItems: { name: string; stock: number; min: number }[];
  topProducts: { name: string; quantity: number }[];
  recentExpenses: { description: string; amount: number; category: string }[];
  alerts: string[];
  knowledge: string[];
};

export async function getBrainContext(): Promise<BrainContext> {
  // 1. Get Basic Metrics
  const metrics = await getDashboardMetrics();

  // 2. Get Detailed Low Stock
  const lowStockIngredients = await prisma.ingredient.findMany({
    where: {
      stock: {
        lte: prisma.ingredient.fields.minStock,
      },
    },
    select: { name: true, stock: true, minStock: true },
  });

  // 3. Get Top Products (Last 30 days to ensure data)
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 30);

  // Fetch relevant sale IDs first to avoid relation filtering issues in groupBy
  const recentSales = await prisma.sale.findMany({
    where: {
      date: { gte: dateLimit },
      status: "COMPLETED",
    },
    select: { id: true },
  });

  const saleIds = recentSales.map((s) => s.id);

  let topProducts: { name: string; quantity: number }[] = [];

  if (saleIds.length > 0) {
    const saleItems = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        saleId: { in: saleIds },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: saleItems.map((i) => i.productId) },
      },
      select: { id: true, name: true },
    });

    topProducts = saleItems.map((item) => ({
      name:
        productDetails.find((p) => p.id === item.productId)?.name ||
        "Desconocido",
      quantity: item._sum.quantity || 0,
    }));
  }

  // 4. Recent Expenses
  const recentExpenses = await prisma.expense.findMany({
    take: 5,
    orderBy: { date: "desc" },
    select: { description: true, amount: true, category: true },
  });

  // 5. Advanced Anomaly Detection Rules
  const alerts: string[] = [];

  // Rule 1: Margin Health (Only if there are sales)
  if (metrics.totalSales > 0) {
    if (metrics.margin < 20) {
      alerts.push(
        "🚨 CRÍTICO: Tu margen es peligrosamente bajo (" +
          metrics.margin.toFixed(1) +
          "%). ¡Sube precios o baja costos YA!",
      );
    } else if (metrics.margin < 35) {
      alerts.push(
        "⚠️ Tu margen (" +
          metrics.margin.toFixed(1) +
          "%) podría mejorar. La meta saludable es 40%+.",
      );
    }
  }

  // Rule 2: Stock Health
  if (lowStockIngredients.length > 3) {
    alerts.push(
      "📦 Alerta de Stock: Tienes " +
        lowStockIngredients.length +
        " insumos en nivel crítico.",
    );
  }

  // Rule 3: Sales Velocity (No sales check)
  if (metrics.totalSales === 0) {
    const hoursOpen = new Date().getHours() - 9; // Assuming opens at 9 AM
    if (hoursOpen > 0) {
      // Only alert if open for a while
      if (hoursOpen > 2) {
        alerts.push(
          "📉 Ventas Lentas: Han pasado horas y no hay ventas registradas hoy.",
        );
      }
    } else {
      alerts.push("💡 El día recién comienza. ¡Hoy será un gran día!");
    }
  }

  // Rule 4: High Expense Warning
  if (recentExpenses.length > 0) {
    const todayExpenses = recentExpenses
      .filter((e) => Number(e.amount) > 0)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // If expenses are more than 50% of revenue (and revenue exists)
    if (metrics.totalSales > 0 && todayExpenses > metrics.totalSales * 0.5) {
      alerts.push(
        "💸 Los gastos recientes están comiendo más del 50% de tus ingresos de hoy.",
      );
    }
  }

  // 5. Knowledge Base
  const knowledgeBase = await prisma.brainKnowledge.findMany({
    where: { isActive: true },
  });

  return {
    dailyMetrics: {
      sales: metrics.totalSales,
      orders: metrics.totalOrders,
      profit: metrics.estimatedProfit,
      margin: metrics.margin,
    },
    lowStockItems: lowStockIngredients.map((i) => ({
      name: i.name,
      stock: Number(i.stock),
      min: Number(i.minStock),
    })),
    topProducts,
    recentExpenses: recentExpenses.map((e) => ({
      description: e.description || "Gasto sin descripción",
      amount: Number(e.amount),
      category: e.category,
    })),
    alerts,
    knowledge: knowledgeBase.map((k) => k.content),
  };
}

import { geminiModel } from "@/lib/gemini";

export async function chatWithBrain(query: string) {
  try {
    const context = await getBrainContext();

    const systemPrompt = `
    Eres el "Cerebro Digital" de Burger Tilin, un asistente de IA experto en negocios gastronómicos.
    Responde de forma ejecutiva, corta y estratégica.
    
    ESTADO ACTUAL DEL NEGOCIO:
    - Ventas Hoy: $${context.dailyMetrics.sales} (${context.dailyMetrics.orders} pedidos)
    - Ganancia Estimada: $${context.dailyMetrics.profit}
    - Margen: ${context.dailyMetrics.margin.toFixed(1)}% (Meta >40%)
    
    ALERTA STOCK:
    ${context.lowStockItems.length > 0 ? context.lowStockItems.map((i) => `- ${i.name}: ${i.stock} (Min: ${i.min})`).join("\n") : "Stock OK."}
    
    GASTOS:
    ${context.recentExpenses.map((e) => `- ${e.description}: $${e.amount}`).join("\n")}
    
    CONOCIMIENTO:
    ${context.knowledge.join("\n")}
    
    ALERTAS:
    ${context.alerts.join("\n")}
    
    INSTRUCCIONES:
    1. Responde preguntas sobre el negocio usando estos datos.
    2. Si el margen es bajo, sé crítico.
    3. Si es urgente, usa emojis de alerta.
    
    PREGUNTA: "${query}"
    `;

    const result = await geminiModel.generateContent(systemPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ ERROR CRÍTICO GEMINI:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const modelConfigured = process.env.GEMINI_MODEL || "gemini-1.5-pro";

    // Permission Denied (Invalid Key)
    if (
      errorMessage.includes("403") ||
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("API key not valid")
    ) {
      return "⛔ Error 403: Tu API Key no es válida. Revisa que 'GEMINI_API_KEY' en el archivo .env sea correcta.";
    }

    // Model Not Found
    if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
      return `❓ Error 404: El modelo '${modelConfigured}' no está disponible o tu API Key no tiene permiso. Prueba cambiar GEMINI_MODEL en .env a 'gemini-1.5-flash'.`;
    }

    // Quota Exceeded
    if (errorMessage.includes("429")) {
      return "⏳ Límite de cuota excedido. Espera unos minutos.";
    }

    return `⚠️ Error de Conexión (${errorMessage}). Revisa la consola.`;
  }
}
