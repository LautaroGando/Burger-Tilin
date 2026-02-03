import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const filename = path.join(backupDir, `backup-${timestamp}.json`);

  console.log("Iniciando backup de base de datos...");

  const data = {
    products: await prisma.product.findMany(),
    categories: await prisma.category.findMany(),
    ingredients: await prisma.ingredient.findMany(),
    storeHours: await prisma.storeHours.findMany(),
    recipes: await prisma.recipeItem.findMany(),
    productExtras: await prisma.productExtra.findMany(),
    sales: await prisma.sale.findMany(),
    saleItems: await prisma.saleItem.findMany(),
  };

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log(`✅ Backup completado exitosamente: ${filename}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
