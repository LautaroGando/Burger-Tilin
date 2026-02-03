"use server";

import { prisma } from "@/lib/prisma";

export async function sendLowStockReport() {
  try {
    const lowStockIngredients = await prisma.ingredient.findMany({
      where: {
        stock: { lte: prisma.ingredient.fields.minStock },
      },
    });

    if (lowStockIngredients.length === 0) {
      return { success: false, message: "No hay insumos con bajo stock" };
    }

    const message =
      `🚨 *REPORTE DE FALTANTES - Burger Tilin* 🚨\n\n` +
      lowStockIngredients
        .map(
          (ing) =>
            `• *${ing.name}*: ${ing.stock} ${ing.unit} (Mín: ${ing.minStock})`,
        )
        .join("\n") +
      `\n\n📅 Generado: ${new Date().toLocaleString()}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/?text=${encodedMessage}`;

    return { success: true, link: whatsappLink };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al generar el reporte" };
  }
}
