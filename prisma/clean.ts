import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database products and categories...");

  try {
    // Delete in order to avoid foreign key constraints
    await prisma.productExtra.deleteMany({});
    // We don't delete Sales or Recipes here assuming they might not exist or we want to keep them if possible,
    // but if products are deleted, relation issues might arise if not checking cascade.
    // Given the context of "just seeded", sales with these products are unlikely.
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    console.log("Database cleaned.");
  } catch (error) {
    console.error("Error cleaning database:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
