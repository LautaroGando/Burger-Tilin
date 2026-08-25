"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Gets all slots for a given combo product
 */
export async function getComboSlots(comboId: string) {
  try {
    const slots = await prisma.comboSlot.findMany({
      where: { comboId },
      include: {
        defaultProduct: true,
        alternatives: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    const serializedSlots = slots.map((slot) => ({
      ...slot,
      defaultProduct: slot.defaultProduct
        ? {
            ...slot.defaultProduct,
            price: Number(slot.defaultProduct.price),
            priceApps: slot.defaultProduct.priceApps ? Number(slot.defaultProduct.priceApps) : null,
            pricePedidosYa: slot.defaultProduct.pricePedidosYa ? Number(slot.defaultProduct.pricePedidosYa) : null,
            priceRappi: slot.defaultProduct.priceRappi ? Number(slot.defaultProduct.priceRappi) : null,
            priceMP: slot.defaultProduct.priceMP ? Number(slot.defaultProduct.priceMP) : null,
          }
        : null,
      alternatives: slot.alternatives.map((alt) => ({
        ...alt,
        product: alt.product
          ? {
              ...alt.product,
              price: Number(alt.product.price),
              priceApps: alt.product.priceApps ? Number(alt.product.priceApps) : null,
              pricePedidosYa: alt.product.pricePedidosYa ? Number(alt.product.pricePedidosYa) : null,
              priceRappi: alt.product.priceRappi ? Number(alt.product.priceRappi) : null,
              priceMP: alt.product.priceMP ? Number(alt.product.priceMP) : null,
            }
          : null,
      })),
    }));

    return { success: true, data: serializedSlots };
  } catch (error) {
    console.error("Error fetching combo slots:", error);
    return { success: false, error: "Error al obtener componentes del combo" };
  }
}

/**
 * Creates a new slot for a combo
 */
export async function createComboSlot(data: {
  comboId: string;
  name: string;
  defaultProductId: string;
  sortOrder?: number;
}) {
  try {
    const slot = await prisma.comboSlot.create({
      data: {
        comboId: data.comboId,
        name: data.name,
        defaultProductId: data.defaultProductId,
        sortOrder: data.sortOrder || 0,
      },
    });
    revalidatePath("/admin/products");
    return { success: true, data: slot };
  } catch (error) {
    console.error("Error creating combo slot:", error);
    return { success: false, error: "Error al crear el componente" };
  }
}

/**
 * Deletes a slot
 */
export async function deleteComboSlot(slotId: string) {
  try {
    await prisma.comboSlot.delete({
      where: { id: slotId },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting combo slot:", error);
    return { success: false, error: "Error al eliminar el componente" };
  }
}

/**
 * Adds an alternative product to a slot
 */
export async function addSlotAlternative(slotId: string, productId: string, extraPrice: number = 0) {
  try {
    // Prevent duplicate
    const existing = await prisma.comboSlotAlternative.findFirst({
      where: { slotId, productId },
    });
    if (existing) {
      return { success: false, error: "Esta alternativa ya existe" };
    }

    const alt = await prisma.comboSlotAlternative.create({
      data: { slotId, productId, extraPrice },
    });
    revalidatePath("/admin/products");
    return { success: true, data: alt };
  } catch (error) {
    console.error("Error adding alternative:", error);
    return { success: false, error: "Error al agregar la alternativa" };
  }
}

/**
 * Removes an alternative from a slot
 */
export async function removeSlotAlternative(alternativeId: string) {
  try {
    await prisma.comboSlotAlternative.delete({
      where: { id: alternativeId },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Error removing alternative:", error);
    return { success: false, error: "Error al eliminar la alternativa" };
  }
}

/**
 * Updates the extra price of an alternative
 */
export async function updateSlotAlternativePrice(alternativeId: string, extraPrice: number) {
  try {
    const alt = await prisma.comboSlotAlternative.update({
      where: { id: alternativeId },
      data: { extraPrice },
    });
    revalidatePath("/admin/products");
    return { success: true, data: alt };
  } catch (error) {
    console.error("Error updating alternative price:", error);
    return { success: false, error: "Error al actualizar precio extra" };
  }
}
