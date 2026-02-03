"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const expenseSchema = z.object({
  description: z.string().min(2, "Descripción requerida"),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  category: z.string().min(1, "Categoría requerida"),
  isFixed: z.boolean().default(false),
  date: z.date().default(() => new Date()), // Defaults to now if not provided
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export async function createExpense(data: ExpenseFormValues) {
  try {
    const validated = expenseSchema.parse(data);

    await prisma.expense.create({
      data: {
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        isFixed: validated.isFixed,
        date: validated.date,
      },
    });

    revalidatePath("/admin/expenses", "page");
    revalidatePath("/admin", "page"); // Update dashboard profit across all pages
    return { success: true };
  } catch (error) {
    console.error("Create Expense Error:", error);
    return { success: false, error: "Error al registrar gasto" };
  }
}

export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 50, // Limit for MVP
    });

    // Explicitly serialize to plain objects and convert Decimal to Number
    const serialized = expenses.map((e) => ({
      id: e.id,
      description: e.description || "",
      amount: Number(e.amount),
      category: e.category,
      isFixed: e.isFixed,
      date: e.date,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Get Expenses Error:", error);
    return { success: false, data: [] };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Error eliminando gasto" };
  }
}

export async function updateExpense(id: string, data: ExpenseFormValues) {
  try {
    const validated = expenseSchema.parse(data);

    await prisma.expense.update({
      where: { id },
      data: {
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        isFixed: validated.isFixed,
        date: validated.date,
      },
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update Expense Error:", error);
    return { success: false, error: "Error al actualizar gasto" };
  }
}

export async function getExpenseStats() {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: currentMonth,
        },
      },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const fixed = expenses
      .filter((e) => e.isFixed)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const variable = total - fixed;

    return { total, fixed, variable };
  } catch {
    return { total: 0, fixed: 0, variable: 0 };
  }
}
