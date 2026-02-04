import type { NextAuthConfig } from "next-auth";

export const authConfig = {
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
  providers: [], // Providers are defined in auth.ts
} satisfies NextAuthConfig;
