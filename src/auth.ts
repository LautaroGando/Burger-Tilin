import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getUser(username: string) {
  try {
    // Using raw query because Prisma Client generation is sometimes blocked in dev
    const users = await prisma.$queryRawUnsafe<any[]>(
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
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("--- Login Attempt Begin ---");
        console.log("Username provided:", credentials?.username);
        console.log(
          "Password length provided:",
          String(credentials?.password).length,
        );

        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const user = await getUser(username);

          if (!user) {
            console.log(
              "AUTH DEBUG: User NOT found in DB for username:",
              username,
            );
            return null;
          }

          console.log("AUTH DEBUG: User found in DB.");
          console.log("AUTH DEBUG: User keys:", Object.keys(user));
          console.log(
            "AUTH DEBUG: Password in DB length:",
            user.password?.length,
          );

          const passwordsMatch = await compare(password, user.password);

          if (passwordsMatch) {
            console.log("AUTH DEBUG: Password MATCHED!");
            console.log("--- Login Attempt Success ---");
            return {
              id: user.id || user.ID,
              name: user.name || user.NAME,
              username: user.username || user.USERNAME,
              email: user.username || user.USERNAME, // NextAuth sometimes expects email
            };
          }
          console.log("AUTH DEBUG: Password MISMATCH.");
        } else {
          console.log("AUTH DEBUG: Zod validation failed.");
        }

        console.log("--- Login Attempt Failed ---");
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error user.username is not typed by default in NextAuth User type but we know it's there
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // @ts-expect-error session.user is not completely typed yet
        session.user.id = token.id;
        // @ts-expect-error session.user is not completely typed yet
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
