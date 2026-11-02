import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-compatible (sem Prisma/bcrypt) para o middleware.
 * O `auth.ts` completa com o provider Credentials no Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        (pathname === "/cadastro" && process.env.ALLOW_PUBLIC_SIGNUP === "true");

      if (isPublic) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.organizationId = token.organizationId as string;
      session.user.role = token.role as typeof session.user.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
