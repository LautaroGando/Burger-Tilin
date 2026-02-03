import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("--- CATEGORIES ---");
  categories.forEach((c) => console.log(`${c.id}: ${c.name}`));

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  console.log("\n--- PRODUCTS ---");
  products.forEach((p) => {
    console.log(`${p.id}: ${p.name} (${p.category?.name || "No Cat"})`);
  });

  const extras = await prisma.$queryRawUnsafe('SELECT * FROM "ProductExtra"');
  console.log("\n--- PRODUCT EXTRAS MAPPING ---");
  console.log(JSON.stringify(extras, null, 2));

  process.exit(0);
}

main();
