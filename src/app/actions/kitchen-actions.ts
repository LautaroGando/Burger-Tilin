"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type KitchenOrder = {
  id: string;
  clientName: string;
  status: string; // PENDING, IN_PROGRESS, READY, DELIVERED
  items: { productName: string; quantity: number }[];
  date: Date;
  minutesWaiting: number;
};

export type KitchenOverview = {
  orders: KitchenOrder[];
  pendingCount: number;
  inProgressCount: number;
  estimatedWaitTime: number; // in minutes
};

export async function getKitchenOverview(): Promise<{
  success: boolean;
  data?: KitchenOverview;
}> {
  try {
    const activeOrders = await prisma.sale.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS", "READY"] },
      },
      include: {
        items: true,
      },
      orderBy: { date: "asc" },
    });

    const now = new Date();

    // Fix: Fetch product names
    const productIds = [
      ...new Set(activeOrders.flatMap((o) => o.items.map((i) => i.productId))),
    ];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // Cleaner mapping with product lookup
    const cleanerOrders: KitchenOrder[] = activeOrders.map((o) => ({
      id: o.id,
      clientName: o.clientName || "Mostrador",
      status: o.status,
      items: o.items.map((i) => ({
        productName:
          products.find((p) => p.id === i.productId)?.name || "Desconocido",
        quantity: i.quantity,
      })),
      date: o.date,
      minutesWaiting: Math.floor((now.getTime() - o.date.getTime()) / 60000),
    }));

    // Calculate Capacity Load
    // Heuristic: 10 mins per order batch + 2 mins per burger
    // Only count PENDING and IN_PROGRESS for "Upcoming Load"
    const activeLoadOrders = cleanerOrders.filter(
      (o) => o.status === "PENDING" || o.status === "IN_PROGRESS",
    );

    let estimatedWaitTime = 0;
    activeLoadOrders.forEach((o) => {
      estimatedWaitTime += 5; // Base setup time
      o.items.forEach((i) => {
        estimatedWaitTime += i.quantity * 2; // 2 mins per item
      });
    });

    // Divide by parallel capacity? Assuming 1 line for now.

    return {
      success: true,
      data: {
        orders: cleanerOrders,
        pendingCount: cleanerOrders.filter((o) => o.status === "PENDING")
          .length,
        inProgressCount: cleanerOrders.filter((o) => o.status === "IN_PROGRESS")
          .length,
        estimatedWaitTime,
      },
    };
  } catch (error) {
    console.error("Kitchen Error:", error);
    return { success: false };
  }
}

export async function advanceOrderStatus(id: string, currentStatus: string) {
  let nextStatus = "IN_PROGRESS";
  if (currentStatus === "PENDING") nextStatus = "IN_PROGRESS";
  else if (currentStatus === "IN_PROGRESS") nextStatus = "READY";
  else if (currentStatus === "READY") nextStatus = "COMPLETED"; // Archives it

  try {
    await prisma.sale.update({
      where: { id },
      data: { status: nextStatus },
    });
    revalidatePath("/kitchen");
    return { success: true };
  } catch {
    return { success: false };
  }
}
