import { getAdvancedAnalytics } from "./src/app/actions/analytics-actions";
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Checking DB directly...");
  const processingSales = await prisma.sale.findMany({
    select: { id: true, status: true, date: true, total: true },
  });
  console.log("All Sales in DB:", JSON.stringify(processingSales, null, 2));

  console.log("\nCalling getAdvancedAnalytics()...");
  const result = await getAdvancedAnalytics();
  console.log("Result success:", result.success);
  if (result.success && result.data) {
    console.log("Total Sales in Analytics:", result.data.totalSales);
    console.log("Health Score:", result.data.healthScore);
    console.log("Sales Projection:", result.data.salesProjection);
  } else {
    console.error("Result data is missing or failed");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
