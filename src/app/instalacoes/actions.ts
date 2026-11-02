"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { withOrgContext } from "@/lib/tenant-db";

export async function createInstallation(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name) throw new Error("Informe o nome da instalação/estrutura.");

  const installation = await withOrgContext(session.user.organizationId, async (tx) => {
    const created = await tx.installation.create({
      data: {
        name: location ? `${name} — ${location}` : name,
        organizationId: session.user.organizationId,
      },
    });

    const year = new Date().getFullYear();
    await tx.cycle.create({
      data: { name: `Ciclo ${year}.1`, installationId: created.id },
    });

    return created;
  });

  revalidatePath("/instalacoes");
  redirect(`/instalacoes/${installation.id}/dashboard`);
}

export async function deleteInstallation(installationId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    throw new Error("Apenas administradores da organização podem remover instalações.");
  }

  await withOrgContext(session.user.organizationId, async (tx) => {
    const installation = await tx.installation.findUnique({ where: { id: installationId } });
    if (!installation || installation.organizationId !== session.user.organizationId) {
      notFound();
    }

    const assessmentIds = (
      await tx.assessment.findMany({
        where: { installationId },
        select: { id: true },
      })
    ).map((a) => a.id);

    const actionIds = (
      await tx.action.findMany({
        where: { assessmentId: { in: assessmentIds } },
        select: { id: true },
      })
    ).map((a) => a.id);

    await tx.actionComment.deleteMany({ where: { actionId: { in: actionIds } } });
    await tx.actionLog.deleteMany({ where: { actionId: { in: actionIds } } });
    await tx.comment.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await tx.assessmentRevision.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await tx.auditLog.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await tx.action.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
    await tx.evidence.deleteMany({ where: { document: { installationId } } });
    await tx.assessment.deleteMany({ where: { installationId } });
    await tx.externalAnalysis.deleteMany({ where: { installationId } });
    await tx.documentFile.deleteMany({ where: { installationId } });
    await tx.cycle.deleteMany({ where: { installationId } });
    await tx.installation.delete({ where: { id: installationId } });
  });

  revalidatePath("/instalacoes");
}
