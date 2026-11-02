"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { withOrgContext } from "@/lib/tenant-db";

export async function changeOwnPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("Preencha a senha atual e a nova senha (com confirmação).");
  }
  if (newPassword.length < 8) {
    throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("A confirmação não bate com a nova senha.");
  }

  await withOrgContext(session.user.organizationId, async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: session.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error("Senha atual incorreta.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
  });

  redirect("/conta?sucesso=1");
}
