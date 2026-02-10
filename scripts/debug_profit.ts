import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const normalizePlatformName = (name: string) => {
  if (!name) return "LOCAL";
  const normalized = name.toUpperCase().trim();
  if (normalized.includes("PEDIDOS")) return "PEYA";
  if (normalized.includes("RAPPI")) return "RAPPI";
  if (normalized.includes("MERCADO")) return "MERCADOPAGO";
  return "LOCAL";
};

async function main() {
  console.log("Searching for product...");
  // Try to find the specific product mentioned: "Combo La Tilin Americana Doble + Onion..."
  // I'll search for "Americana" and verify the list
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: "Americana",
        mode: "insensitive",
      },
    },
    include: {
      recipe: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  console.log(`Found ${products.length} products with 'Americana'.`);

  // Let's filter in memory or pick top matches
  const targetProduct =
    products.find((p) => p.name.includes("Onion")) || products[0];

  if (!targetProduct) {
    console.log("Product not found even with broader search.");
    return;
  }

  const p = targetProduct;
  console.log(`\n--- Product Analysis ---`);
  console.log(`Name: ${p.name}`);
  console.log(`ID: ${p.id}`);
  console.log(`Base Price: ${p.price}`);

  let totalRecipeCost = 0;
  console.log("Recipe:");
  p.recipe.forEach((item) => {
    const cost = Number(item.quantity) * Number(item.ingredient.cost);
    totalRecipeCost += cost;
    console.log(
      `  - ${item.ingredient.name}: ${item.quantity} units @ $${item.ingredient.cost} = $${cost}`,
    );
  });
  console.log(`Total Recipe Cost: $${totalRecipeCost}`);

  console.log(`\n--- Sales Analysis (Last 10) ---`);
  const sales = await prisma.sale.findMany({
    where: {
      items: {
        some: {
          productId: p.id,
        },
      },
      status: "COMPLETED",
    },
    include: {
      items: true,
    },
    take: 10,
    orderBy: { date: "desc" },
  });

  if (sales.length === 0) {
    console.log("No sales found for this product.");
    return;
  }

  // Fetch Platform Config
  const platformConfigs: any[] = await prisma.$queryRawUnsafe(
    'SELECT name, commission FROM "PlatformConfig"',
  );
  const commMap: Record<string, number> = {};
  platformConfigs.forEach((c) => {
    commMap[normalizePlatformName(c.name)] = (c.commission || 0) / 100;
  });

  for (const sale of sales) {
    const saleItem = sale.items.find((i) => i.productId === p.id);
    if (!saleItem) continue;

    console.log(
      `\nSale Date: ${sale.date.toISOString().split("T")[0]} | Channel: ${sale.channel}`,
    );

    // Determine Commission Rate
    let commRate = 0;
    let isFrozen = false;
    if (Number(sale.discount) < 0) {
      commRate = Math.abs(Number(sale.discount)) / 100;
      isFrozen = true;
    } else {
      commRate = commMap[normalizePlatformName(sale.channel)] ?? 0;
    }
    console.log(
      `Commission Rate: ${(commRate * 100).toFixed(2)}% ${isFrozen ? "(Frozen)" : "(Dynamic)"}`,
    );

    // Profit Calculation Logic
    const quantity = saleItem.quantity;
    const unitPrice = Number(saleItem.unitPrice);
    const itemRevenue = unitPrice * quantity;
    const itemCost = totalRecipeCost * quantity; // Assuming current cost for simplicity in debugging

    // Proportional Commission
    // If sale has multiple items, commission is distributed by revenue share
    const saleTotal = Number(sale.total);
    const saleCommissionTotal = saleTotal * commRate;

    // If only one item type in sale (or proportional logic matches):
    // itemCommission = itemRevenue * commRate
    // But let's follow the code exactly:
    const commissionFactor =
      saleTotal > 0 ? saleCommissionTotal / saleTotal : 0;
    // factor should be approx commRate
    const itemCommission = itemRevenue * commissionFactor;

    const profit = itemRevenue - itemCost - itemCommission;

    console.log(`  Qty: ${quantity}`);
    console.log(`  Unit Price: $${unitPrice}`);
    console.log(`  Revenue: $${itemRevenue}`);
    console.log(`  Total Cost (Current): $${itemCost}`);
    console.log(`  Commission: $${itemCommission.toFixed(2)}`);
    console.log(`  Profit: $${profit.toFixed(2)}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
