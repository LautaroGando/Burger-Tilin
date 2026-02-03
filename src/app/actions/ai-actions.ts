"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function trainBrain(
  content: string,
  category: string = "general",
) {
  try {
    const knowledge = await prisma.brainKnowledge.create({
      data: {
        content,
        category,
      },
    });
    revalidatePath("/admin/brain");
    return { success: true, data: knowledge };
  } catch (error) {
    console.error("Training Error:", error);
    return { success: false, error: "Error al guardar conocimiento." };
  }
}

export async function getBrainKnowledge() {
  try {
    return await prisma.brainKnowledge.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function deleteKnowledge(id: string) {
  try {
    await prisma.brainKnowledge.delete({ where: { id } });
    revalidatePath("/admin/brain");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function autoTrain(content: string, category: string = "system") {
  try {
    await prisma.brainKnowledge.create({
      data: {
        content,
        category,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Auto Train Error:", error);
  }
}
