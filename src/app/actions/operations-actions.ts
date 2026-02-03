"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* --- WASTE LOGGING --- */

export async function logWaste(data: {
  description: string;
  cost: number;
  ingredientId?: string;
  quantity?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create Waste Record
    await prisma.wasteLog.create({
      data: {
        description: data.description,
        cost: data.cost,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
      },
    });

    // 2. Deduct Stock if linked to an ingredient
    if (data.ingredientId && data.quantity) {
      await prisma.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          stock: { decrement: data.quantity },
        },
      });
    }

    revalidatePath("/operations");
    revalidatePath("/ingredients");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to log waste" };
  }
}

export async function getWasteLogs() {
  try {
    const logs = await prisma.wasteLog.findMany({
      orderBy: { date: "desc" },
      include: { ingredient: true },
      take: 50, // Recent logs
    });
    return { success: true, data: logs };
  } catch {
    return { success: false, data: [] };
  }
}

/* --- REFUNDS --- */

export async function refundSale(
  saleId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sale.update({
      where: { id: saleId },
      data: { status: "REFUNDED" },
    });
    revalidatePath("/operations");
    revalidatePath("/sales");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to refund sale" };
  }
}

export async function findSaleById(id: string) {
  try {
    // Search by exact ID or simple match
    if (id.length < 5) return { success: false, error: "ID too short" }; // Prevent fetching all on empty

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!sale) return { success: false, error: "Sale not found" };

    return { success: true, data: sale };
  } catch {
    return { success: false, error: "Error searching sale" };
  }
}
