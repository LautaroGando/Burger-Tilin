import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "./auth.config";

interface DbUser {
  id: string;
  ID?: string;
  username: string;
  USERNAME?: string;
  password: string;
  name?: string | null;
  NAME?: string | null;
}

async function getUser(username: string) {
  try {
    // Using raw query because Prisma Client generation is sometimes blocked in dev
    const users = await prisma.$queryRawUnsafe<DbUser[]>(
      'SELECT * FROM "User" WHERE "username" = $1 LIMIT 1',
      username,
    );
    return users[0] || null;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("--- Login Attempt Begin ---");
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const user = await getUser(username);

          if (!user) return null;

          const passwordsMatch = await compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id || user.ID,
              name: user.name || user.NAME,
              username: user.username || user.USERNAME,
              email: user.username || user.USERNAME,
            };
          }
        }
        return null;
      },
    }),
  ],
});
