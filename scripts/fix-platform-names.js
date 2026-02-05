import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Updating Platform Names ---");

  // PedidosYa -> PEYA
  await prisma.$executeRawUnsafe(
    "UPDATE \"PlatformConfig\" SET name = 'PEYA' WHERE name = 'PedidosYa'",
  );

  // Rappi -> RAPPI
  await prisma.$executeRawUnsafe(
    "UPDATE \"PlatformConfig\" SET name = 'RAPPI' WHERE name = 'Rappi'",
  );

  // MercadoPago -> MERCADOPAGO
  await prisma.$executeRawUnsafe(
    "UPDATE \"PlatformConfig\" SET name = 'MERCADOPAGO' WHERE name = 'MercadoPago'",
  );

  const configs = await prisma.$queryRawUnsafe(
    'SELECT * FROM "PlatformConfig"',
  );
  console.log("Updated configs:", configs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
