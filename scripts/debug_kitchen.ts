import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching ALL recent sales...");

  const sales = await prisma.sale.findMany({
    take: 10,
    orderBy: { date: "desc" },
    include: {
      items: true,
    },
  });

  console.log(`Found ${sales.length} recent sales.`);

  sales.forEach((o) => {
    console.log(`\nOrder #${o.id.slice(0, 4)}`);
    // Quote to check for whitespace in status
    console.log(`  Status: '${o.status}'`);
    console.log(`  Date: ${o.date.toISOString()}`);
    console.log(`  Items: ${o.items.length}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
