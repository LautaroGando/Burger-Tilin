export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
  stock: number;
  minStock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceApps?: number | null;
  categoryId: string | null;
  isActive: boolean;
  showPublic: boolean;
  isPromo: boolean;
  promoDiscount: number;
  isPromoApps: boolean;
  promoDiscountApps: number;
  category?: {
    id: string;
    name: string;
  } | null;
  recipe?: RecipeItem[];
  allowedExtras?: ProductExtra[];
  comboSlots?: ComboSlot[];
  comboDefaults?: ComboSlot[];
  comboAlternatives?: ComboSlotAlternative[];
}

export interface ProductExtra {
  id: string;
  mainProductId: string;
  extraProductId: string;
  extraProduct?: Product;
}

export interface RecipeItem {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
  ingredient: Ingredient;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
  fulfillments?: SaleItemFulfillment[];
}

export interface Sale {
  id: string;
  date: Date;
  total: number;
  discount: number;
  paymentMethod: string;
  channel: string;
  status: string;
  clientName?: string | null;
  customerId?: string | null;
  customer?: {
    id: string;
    name: string | null;
    totalSpent: number;
  } | null;
  items: SaleItem[];
}

export interface ComboSlot {
  id: string;
  comboId: string;
  name: string;
  defaultProductId: string;
  defaultProduct?: Product;
  alternatives?: ComboSlotAlternative[];
  sortOrder: number;
}

export interface ComboSlotAlternative {
  id: string;
  slotId: string;
  productId: string;
  product?: Product;
  extraPrice: number;
}

export interface SaleItemFulfillment {
  id: string;
  saleItemId: string;
  slotId: string;
  configuredProductId: string;
  deliveredProductId: string;
  replacementReason: string | null;
  createdAt: Date;
}
