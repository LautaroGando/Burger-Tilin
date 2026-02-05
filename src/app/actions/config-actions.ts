"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface RawPlatformConfig {
  id: string;
  name: string;
  commission: number | string;
  updatedAt: Date;
}

export async function getPlatformConfigs() {
  try {
    const configs = await prisma.$queryRawUnsafe<RawPlatformConfig[]>(
      'SELECT * FROM "PlatformConfig"',
    );

    if (!configs || configs.length === 0) {
      // Seed defaults
      const defaults = [
        { id: crypto.randomUUID(), name: "PEYA", commission: 0 },
        { id: crypto.randomUUID(), name: "RAPPI", commission: 0 },
        { id: crypto.randomUUID(), name: "MERCADOPAGO", commission: 0 },
      ];

      for (const def of defaults) {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "PlatformConfig" (id, name, commission, "updatedAt") VALUES ($1, $2, $3, NOW())',
          def.id,
          def.name,
          def.commission,
        );
      }

      // Fetch again
      const seeded = await prisma.$queryRawUnsafe<RawPlatformConfig[]>(
        'SELECT * FROM "PlatformConfig"',
      );
      return { success: true, data: seeded };
    }

    return { success: true, data: configs };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error fetching platform configs" };
  }
}

export async function updatePlatformConfig(id: string, commission: number) {
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE "PlatformConfig" SET commission = $1 WHERE id = $2',
      commission,
      id,
    );
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error updating platform config" };
  }
}
