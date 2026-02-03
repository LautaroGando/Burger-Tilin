import { getProducts } from "@/app/actions/product-actions";
import { getCategories } from "@/app/actions/category-actions";
import { getStoreHours } from "@/app/actions/store-hours-actions";
import MenuClient from "./menu-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { data: products } = await getProducts();
  const { data: categories } = await getCategories();
  const storeHours = await getStoreHours();

  return (
    <div className="bg-black min-h-screen">
      <MenuClient
        products={products || []}
        categories={categories || []}
        storeHours={storeHours}
      />
    </div>
  );
}
