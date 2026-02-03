import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Categories
  const categories = [
    { name: "Hamburguesas" },
    { name: "Papas Fritas" },
    { name: "Bebidas" },
    { name: "Extras" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const burgersCat = await prisma.category.findUnique({
    where: { name: "Hamburguesas" },
  });
  const friesCat = await prisma.category.findUnique({
    where: { name: "Papas Fritas" },
  });
  const drinksCat = await prisma.category.findUnique({
    where: { name: "Bebidas" },
  });
  const extrasCat = await prisma.category.findUnique({
    where: { name: "Extras" },
  });

  // Products
  const products = [
    {
      name: "Tilin Simple",
      description: "Medallón 120g, cheddar x2, salsa tilin, pan de papa",
      price: 6500,
      categoryId: burgersCat?.id,
      image: "/products/simple.jpg",
    },
    {
      name: "Tilin Doble",
      description: "Doble medallón 120g, cheddar x4, salsa tilin, pan de papa",
      price: 8500,
      categoryId: burgersCat?.id,
      image: "/products/doble.jpg",
    },
    {
      name: "Tilin Triple",
      description: "Triple medallón 120g, cheddar x6, panceta, salsa tilin",
      price: 10500,
      categoryId: burgersCat?.id,
      image: "/products/triple.jpg",
    },
    {
      name: "Papas Tilin",
      description: "Papas bastón con cheddar y panceta",
      price: 4500,
      categoryId: friesCat?.id,
      image: "/products/papas.jpg",
    },
    {
      name: "Coca Cola 354ml",
      description: "Lata fría",
      price: 2000,
      categoryId: drinksCat?.id,
    },
    {
      name: "Panceta Extra",
      description: "Extra de panceta crocante",
      price: 1000,
      categoryId: extrasCat?.id,
    },
    {
      name: "Cheddar Extra",
      description: "Extra de queso cheddar",
      price: 800,
      categoryId: extrasCat?.id,
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        price: p.price,
        isActive: true,
        showPublic: true,
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
