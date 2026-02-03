import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("BurgerTilin*3", 10);

  const user = await prisma.user.upsert({
    where: { username: "lautarogandodev@gmail.com" },
    update: { password },
    create: {
      username: "lautarogandodev@gmail.com",
      password,
      name: "Admin",
    },
  });

  console.log("Admin user ready:");
  console.log("Username: lautarogandodev@gmail.com");
  console.log("Password: BurgerTilin*3");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
