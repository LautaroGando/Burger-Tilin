"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to get categories:", error);
    return { success: false, error: "Error al obtener categorías", data: [] };
  }
}

export async function createCategory(name: string) {
  try {
    const trimmedName = name.trim();

    // Check for duplicates
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return { success: false, error: "La categoría ya existe" };
      } else {
        // Reactivate if it was soft-deleted
        await prisma.category.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        revalidatePath("/admin/products");
        revalidatePath("/admin/sales/new");
        return { success: true };
      }
    }

    await prisma.category.create({
      data: { name: trimmedName },
    });
    revalidatePath("/products");
    revalidatePath("/sales/new");
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return {
      success: false,
      error:
        "Error al crear la categoría. Verifique que el nombre no sea duplicado.",
    };
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    await prisma.category.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/products");
    revalidatePath("/sales/new");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if there are products linked
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: "No se puede eliminar: tiene productos asociados.",
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/products");
    revalidatePath("/sales/new");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Error al eliminar la categoría" };
  }
}
