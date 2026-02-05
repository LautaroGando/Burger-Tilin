import { getSalesHistory } from "../src/app/actions/analytics-actions.js";

async function verify() {
  console.log("--- Verifying Sales History & Commissions ---");
  const res = await getSalesHistory("all");

  if (res.success) {
    console.log("Total Revenue:", res.totalRevenue);
    console.log("Total Commissions:", res.totalCommissions);
    console.log("Total Net Revenue:", res.totalNetRevenue);

    if (res.totalRevenue > 0 && res.totalCommissions === 0) {
      const hasApps = res.sales.some((s) =>
        ["PEYA", "RAPPI", "MERCADOPAGO"].includes(s.channel),
      );
      if (hasApps) {
        console.error(
          "FAIL: Found app sales but total commissions is 0. Check name matching.",
        );
      } else {
        console.log(
          "Note: No app sales found in history to calculate commissions from.",
        );
      }
    } else {
      console.log("SUCCESS: Commissions calculated:", res.totalCommissions);
    }
  } else {
    console.error("FAIL: Failed to fetch sales history");
  }
}

verify().catch(console.error);
