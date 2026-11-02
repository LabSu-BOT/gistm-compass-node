import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withRlsBypass } from "@/lib/tenant-db";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@prisma/client";

// Proteção simples contra força bruta: depois de MAX_FAILED_ATTEMPTS
// tentativas seguidas com senha errada, a conta fica bloqueada por
// LOCK_DURATION_MS — sem precisar de um serviço externo de rate limiting.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// `code` vira o valor de `error.code` no catch do login (não aparece na URL
// por si só — quem lê o code é `loginAction`, que decide a mensagem/redirect).
export class AccountLockedError extends CredentialsSignin {
  code = "conta_bloqueada";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Bypass RLS: login ainda não tem organizationId na sessão.
        return withRlsBypass(async (tx) => {
          const user = await tx.user.findUnique({ where: { email } });
          if (!user) return null;

          const lockExpired = user.lockedUntil !== null && user.lockedUntil <= new Date();
          const failedAttempts = lockExpired ? 0 : user.failedLoginAttempts;
          if (user.lockedUntil && !lockExpired) {
            throw new AccountLockedError();
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            const attempts = failedAttempts + 1;
            const locked = attempts >= MAX_FAILED_ATTEMPTS;
            await tx.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: locked ? 0 : attempts,
                lockedUntil: locked ? new Date(Date.now() + LOCK_DURATION_MS) : null,
              },
            });
            if (locked) throw new AccountLockedError();
            return null;
          }

          if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await tx.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: null },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            role: user.role as UserRole,
          };
        });
      },
    }),
  ],
});
