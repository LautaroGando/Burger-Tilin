const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Applying Database Changes...");

    // 1. Add showPublic to Product
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "showPublic" BOOLEAN NOT NULL DEFAULT true`,
    );

    // 2. Create ProductExtra table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductExtra" (
          "id" TEXT NOT NULL,
          "mainProductId" TEXT NOT NULL,
          "extraProductId" TEXT NOT NULL,
          CONSTRAINT "ProductExtra_pkey" PRIMARY KEY ("id")
      )
    `);

    // 3. Create Unique Index
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ProductExtra_mainProductId_extraProductId_key" 
      ON "ProductExtra"("mainProductId", "extraProductId")
    `);

    // 4. Add Constraints (ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ProductExtra" ADD CONSTRAINT "ProductExtra_mainProductId_fkey" 
        FOREIGN KEY ("mainProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch (e) {
      console.log("Constraint mainProductId already exists or error.");
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ProductExtra" ADD CONSTRAINT "ProductExtra_extraProductId_fkey" 
        FOREIGN KEY ("extraProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch (e) {
      console.log("Constraint extraProductId already exists or error.");
    }

    console.log("Success!");
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
