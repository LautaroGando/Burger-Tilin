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
  pricePedidosYa: number | null;
  priceRappi: number | null;
  priceMP: number | null;
  categoryId: string | null;
  isActive: boolean;
  showPublic: boolean;
  isPromo: boolean;
  promoDiscount: number;
  isPromoPY: boolean;
  promoDiscountPY: number;
  isPromoRappi: boolean;
  promoDiscountRappi: number;
  isPromoMP: boolean;
  promoDiscountMP: number;
  category?: {
    id: string;
    name: string;
  } | null;
  recipe?: RecipeItem[];
  allowedExtras?: ProductExtra[];
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
