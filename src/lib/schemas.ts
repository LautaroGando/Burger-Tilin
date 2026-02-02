import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  unit: z.string().min(1, "La unidad es requerida (kg, l, un)"),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  minStock: z.coerce.number().min(0, "El stock mínimo no puede ser negativo"),
});

export const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});
