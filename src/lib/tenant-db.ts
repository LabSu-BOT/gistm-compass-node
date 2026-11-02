import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

/**
 * Executa `fn` numa transação com `app.current_org_id` definido via SET LOCAL.
 * Complementa o ownership em application code com RLS no Postgres.
 *
 * Login/cadastro/seed não usam este helper (ver `withRlsBypass`).
 */
export async function withOrgContext<T>(
  organizationId: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_org_id', ${organizationId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'off', true)`;
    return fn(tx);
  });
}

/**
 * Bypass explícito de RLS para bootstrap (authorize, signup, seed).
 * Só usar fora do caminho autenticado de um tenant.
 */
export async function withRlsBypass<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'on', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_org_id', '', true)`;
    return fn(tx);
  });
}
