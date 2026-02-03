"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { storeHoursSchema, StoreHoursFormValues } from "@/lib/schemas";

export async function getStoreHours() {
  try {
    const hours = await prisma.storeHours.findMany({
      orderBy: { dayOfWeek: "asc" },
    });

    if (hours.length === 0) {
      // Default hours if none exist
      return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
        dayOfWeek: day,
        isOpen: true,
        shifts: [{ openTime: "19:30", closeTime: "23:30" }],
      }));
    }

    return hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      isOpen: h.isOpen,
      shifts: h.shifts as { openTime: string; closeTime: string }[],
    }));
  } catch (error) {
    console.error("Failed to get store hours:", error);
    return [];
  }
}

export async function updateStoreHours(data: StoreHoursFormValues[]) {
  try {
    // Validate each day
    for (const day of data) {
      storeHoursSchema.parse(day);
    }

    for (const day of data) {
      await prisma.storeHours.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: {
          isOpen: day.isOpen,
          shifts: day.shifts as any,
          updatedAt: new Date(),
        },
        create: {
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen,
          shifts: day.shifts as any,
        },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("Failed to update store hours:", error);
    return { success: false, error: "Error al actualizar los horarios" };
  }
}
