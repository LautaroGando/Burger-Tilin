"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { autoTrain } from "./ai-actions";

// Schema for the sale items
const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0), // Snapshot of price at moment of sale
});

// Schema for the full sale
const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Debe haber al menos un producto"),
  paymentMethod: z.string(), // Cash, Transfer, etc.
  total: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
  channel: z.string().optional(),
  clientName: z.string().optional(),
  customerId: z.string().optional().nullable(),
});

export type CreateSaleValues = z.infer<typeof createSaleSchema>;

export async function createSale(data: CreateSaleValues) {
  try {
    const validated = createSaleSchema.parse(data);

    // Use a transaction to ensure stock is only deducted if sale succeeds
    await prisma.$transaction(async (tx) => {
      // 1. Create the Sale Record
      await tx.sale.create({
        data: {
          total: validated.total,
          discount: validated.discount,
          paymentMethod: validated.paymentMethod,
          channel: validated.channel || "COUNTER",
          status: "PENDING", // Start as PENDING for Kitchen
          clientName: validated.clientName,
          customerId: validated.customerId, // Link to registered customer
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      // 1.5 Update Customer Stats if linked
      if (validated.customerId) {
        await tx.customer.update({
          where: { id: validated.customerId },
          data: {
            totalSpent: { increment: validated.total },
            lastPurchase: new Date(),
          },
        });
      }

      // 2. Stock Deduction Logic
      for (const item of validated.items) {
        // Get recipe for this product
        const recipeItems = await tx.recipeItem.findMany({
          where: { productId: item.productId },
        });

        // Deduct each ingredient
        for (const recipeItem of recipeItems) {
          const deductionAmount = Number(recipeItem.quantity) * item.quantity;

          await tx.ingredient.update({
            where: { id: recipeItem.ingredientId },
            data: {
              stock: {
                decrement: deductionAmount,
              },
            },
          });
        }
      }
    });

    // We don't have product names here easily without fetching, so keep it generic or fetch names.
    // For efficiency, we'll just log the value.
    await autoTrain(
      `Nueva venta registrada por un total de $${validated.total} pagado con ${validated.paymentMethod}.`,
      "sales_update",
    );

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/ingredients");
    revalidatePath("/customers"); // Updated to refresh customer list
    revalidatePath("/custom-metrics");

    return { success: true };
  } catch (error) {
    console.error("Sale Error:", error);
    return { success: false, error: "Error al procesar la venta" };
  }
}

export async function getRecentSales() {
  try {
    const sales = await prisma.sale.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    const serialized = sales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        product: {
          ...item.product,
          price: Number(item.product.price),
        },
      })),
    }));

    return { success: true, data: serialized };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getDashboardMetrics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get today's sales
    const todaysSales = await prisma.sale.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                recipe: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            }, // We need recipe to calculate accurate costs
          },
        },
      },
    });

    const grossSalesRaw = todaysSales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0,
    );
    const totalOrders = todaysSales.length;

    // 2. Calculate Estimated Profit (Total Sales - Total Cost of Goods Sold - Commissions)
    let totalCost = 0;
    let totalCommissions = 0;

    todaysSales.forEach((sale) => {
      // Calculate Commission
      if (["RAPPI", "PEYA", "MERCADOPAGO"].includes(sale.channel)) {
        totalCommissions += Number(sale.total) * 0.35;
      }

      sale.items.forEach((item) => {
        const productCost = item.product.recipe.reduce((rSum, rItem) => {
          return rSum + Number(rItem.quantity) * Number(rItem.ingredient.cost);
        }, 0);

        totalCost += productCost * item.quantity;
      });
    });

    const netSales = grossSalesRaw - totalCommissions;
    const estimatedProfit = netSales - totalCost;
    // Calculate margin over GROSS sales to maintain business benchmarks
    const margin =
      grossSalesRaw > 0 ? (estimatedProfit / grossSalesRaw) * 100 : 0;

    return {
      totalSales: netSales, // Return Net Sales as the primary metric
      totalOrders,
      estimatedProfit,
      margin,
    };
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    return {
      totalSales: 0,
      totalOrders: 0,
      estimatedProfit: 0,
      margin: 0,
    };
  }
}

export async function deleteSale(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get sale details including items and ingredients to reverse stock
      const sale = await tx.sale.findUnique({
        where: { id },
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

      if (!sale) throw new Error("Venta no encontrada");

      // 2. Reverse Stock Deduction
      for (const item of sale.items) {
        for (const recipeItem of item.product.recipe) {
          const reversalAmount = Number(recipeItem.quantity) * item.quantity;

          await tx.ingredient.update({
            where: { id: recipeItem.ingredientId },
            data: {
              stock: {
                increment: reversalAmount,
              },
            },
          });
        }
      }

      // 3. Update Customer Stats if linked
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalSpent: { decrement: sale.total },
          },
        });
      }

      // 4. Delete Sale Items first (if not using cascade delete in DB)
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // 5. Delete the Sale
      await tx.sale.delete({
        where: { id },
      });
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/ingredients");
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Delete Sale Error:", error);
    return { success: false, error: "Error al eliminar la venta" };
  }
}
