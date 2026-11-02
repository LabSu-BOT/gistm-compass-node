"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isPublicSignupAllowed } from "@/lib/signup-policy";
import { withRlsBypass } from "@/lib/tenant-db";

export async function signupAction(formData: FormData) {
  if (!isPublicSignupAllowed()) {
    throw new Error("Cadastro público de organização está desabilitado.");
  }

  const orgName = String(formData.get("orgName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!orgName || !name || !email || !password) {
    throw new Error("Preencha todos os campos para criar a organização.");
  }
  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  await withRlsBypass(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Já existe uma conta cadastrada com esse email.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const organization = await tx.organization.create({ data: { name: orgName } });
    await tx.user.create({
      data: { email, passwordHash, name, organizationId: organization.id, role: "ADMIN" },
    });
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/instalacoes" });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error("Organização criada, mas não foi possível entrar automaticamente. Faça login.");
    }
    throw error;
  }
}
