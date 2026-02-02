"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const customerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type CreateCustomerValues = z.infer<typeof customerSchema>;

export async function createCustomer(data: CreateCustomerValues) {
  try {
    const validated = customerSchema.parse(data);

    await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone || null,
        email: validated.email || null,
        totalSpent: 0,
      },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Create Customer Error:", error);
    return { success: false, error: "Error al crear cliente" };
  }
}

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { lastPurchase: "desc" },
      take: 50,
    });
    const serialized = customers.map((c) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
    }));
    return { success: true, data: serialized };
  } catch {
    return { success: false, data: [] };
  }
}

export async function searchCustomers(query: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [{ name: { contains: query } }, { phone: { contains: query } }],
      },
      take: 10,
    });
    const serialized = customers.map((c) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
    }));
    return { success: true, data: serialized };
  } catch {
    return { success: false, data: [] };
  }
}
