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
  pricePedidosYa: z.coerce.number().min(0).optional().nullable(),
  priceRappi: z.coerce.number().min(0).optional().nullable(),
  priceMP: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  isPromo: z.boolean().default(false),
  promoDiscount: z.coerce.number().min(0).max(100).default(0),
  isPromoPY: z.boolean().default(false),
  promoDiscountPY: z.coerce.number().min(0).max(100).default(0),
  isPromoRappi: z.boolean().default(false),
  promoDiscountRappi: z.coerce.number().min(0).max(100).default(0),
  isPromoMP: z.boolean().default(false),
  promoDiscountMP: z.coerce.number().min(0).max(100).default(0),
  showPublic: z.boolean().default(true),
});

export const storeHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  shifts: z.array(
    z.object({
      openTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)"),
      closeTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)"),
    }),
  ),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type StoreHoursFormValues = z.infer<typeof storeHoursSchema>;
