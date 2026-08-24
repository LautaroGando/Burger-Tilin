import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de catálogos y precios...");
  
  // 1. Asegurar que existan los PlatformConfig básicos
  const platformsData = [
    { name: "PEYA", isEnabled: true, integrationStatus: "NOT_CONNECTED", costRules: { commissionRate: 30.34, type: "PERCENTAGE" } },
    { name: "RAPPI", isEnabled: true, integrationStatus: "NOT_CONNECTED", costRules: { commissionRate: 30.85, type: "PERCENTAGE" } },
    { name: "MERCADOPAGO", isEnabled: true, integrationStatus: "NOT_CONNECTED", costRules: { commissionRate: 33.88, type: "PERCENTAGE" } }
  ];

  const platforms: Record<string, string> = {};
  for (const p of platformsData) {
    const existing = await prisma.platformConfig.findUnique({ where: { name: p.name } });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: {
          isEnabled: p.isEnabled,
          integrationStatus: p.integrationStatus,
          costRules: p.costRules
        }
      });
      platforms[p.name] = existing.id;
    } else {
      const created = await prisma.platformConfig.create({
        data: {
          name: p.name,
          isEnabled: p.isEnabled,
          integrationStatus: p.integrationStatus,
          costRules: p.costRules
        }
      });
      platforms[p.name] = created.id;
    }
  }

  // 2. Obtener todos los productos
  const products = await prisma.product.findMany();
  console.log(`Encontrados ${products.length} productos para evaluar.`);

  let migratedCount = 0;
  let missingPricesCount = 0;
  let errorsCount = 0;
  const report: string[] = [];

  for (const product of products) {
    try {
      const pId = product.id;
      let hasAnyPrice = false;

      // PedidosYa
      if (product.pricePedidosYa !== null) {
        hasAnyPrice = true;
        await prisma.productChannelPricing.upsert({
          where: {
            productId_platformId: {
              productId: pId,
              platformId: platforms["PEYA"]
            }
          },
          update: {
            rule: "MANUAL",
            value: product.pricePedidosYa,
            isPromo: product.isPromoPY,
            promoDiscount: product.promoDiscountPY
          },
          create: {
            productId: pId,
            platformId: platforms["PEYA"],
            rule: "MANUAL",
            value: product.pricePedidosYa,
            isPromo: product.isPromoPY,
            promoDiscount: product.promoDiscountPY
          }
        });
      }

      // Rappi
      if (product.priceRappi !== null) {
        hasAnyPrice = true;
        await prisma.productChannelPricing.upsert({
          where: {
            productId_platformId: {
              productId: pId,
              platformId: platforms["RAPPI"]
            }
          },
          update: {
            rule: "MANUAL",
            value: product.priceRappi,
            isPromo: product.isPromoRappi,
            promoDiscount: product.promoDiscountRappi
          },
          create: {
            productId: pId,
            platformId: platforms["RAPPI"],
            rule: "MANUAL",
            value: product.priceRappi,
            isPromo: product.isPromoRappi,
            promoDiscount: product.promoDiscountRappi
          }
        });
      }

      // MercadoPago
      if (product.priceMP !== null) {
        hasAnyPrice = true;
        await prisma.productChannelPricing.upsert({
          where: {
            productId_platformId: {
              productId: pId,
              platformId: platforms["MERCADOPAGO"]
            }
          },
          update: {
            rule: "MANUAL",
            value: product.priceMP,
            isPromo: product.isPromoMP,
            promoDiscount: product.promoDiscountMP
          },
          create: {
            productId: pId,
            platformId: platforms["MERCADOPAGO"],
            rule: "MANUAL",
            value: product.priceMP,
            isPromo: product.isPromoMP,
            promoDiscount: product.promoDiscountMP
          }
        });
      }

      if (hasAnyPrice) {
        migratedCount++;
      } else {
        missingPricesCount++;
        report.push(`Producto sin precios de plataforma: ${product.name} (${product.id})`);
      }
    } catch (e: any) {
      errorsCount++;
      report.push(`Error migrando producto ${product.name} (${product.id}): ${e.message}`);
    }
  }

  // Generar Reporte
  const reportContent = `
# REPORTE DE MIGRACIÓN: PRECIOS MULTICANAL

- Productos totales evaluados: ${products.length}
- Productos migrados con éxito: ${migratedCount}
- Productos sin precios de canales: ${missingPricesCount}
- Errores encontrados: ${errorsCount}

## Detalle:
${report.join('\n')}
  `;

  fs.writeFileSync(path.join(process.cwd(), 'migration-report.md'), reportContent.trim());
  console.log("Migración completada. Reporte guardado en migration-report.md");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
