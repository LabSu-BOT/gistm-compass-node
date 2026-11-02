"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { withOrgContext } from "@/lib/tenant-db";
import type { UserRole } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    throw new Error("Apenas administradores da organização podem gerenciar usuários.");
  }
  return session;
}

export async function createOrgUser(formData: FormData) {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "MEMBER") as UserRole;

  if (!name || !email || !password) {
    throw new Error("Preencha nome, email e senha.");
  }
  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  await withOrgContext(session.user.organizationId, async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Já existe uma conta cadastrada com esse email.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        organizationId: session.user.organizationId,
      },
    });
  });

  revalidatePath("/organizacao/usuarios");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  const session = await requireAdmin();

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) {
    throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  }

  await withOrgContext(session.user.organizationId, async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target || target.organizationId !== session.user.organizationId) {
      throw new Error("Usuário não encontrado nesta organização.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  revalidatePath("/organizacao/usuarios");
}

export async function removeOrgUser(userId: string) {
  const session = await requireAdmin();

  await withOrgContext(session.user.organizationId, async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target || target.organizationId !== session.user.organizationId) {
      throw new Error("Usuário não encontrado nesta organização.");
    }
    if (target.id === session.user.id) {
      throw new Error("Você não pode remover sua própria conta por aqui.");
    }
    if (target.role === "ADMIN") {
      const adminCount = await tx.user.count({
        where: { organizationId: session.user.organizationId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new Error("A organização precisa manter pelo menos um administrador.");
      }
    }

    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/organizacao/usuarios");
}
