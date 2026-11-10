"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { assertInstallationOwnership } from "@/lib/context";
import { getStorage } from "@/lib/storage";
import { saveDocumentFile } from "@/lib/document-upload";
import { flash } from "@/lib/flash";

function revalidateInstallation(installationId: string) {
  revalidatePath(`/instalacoes/${installationId}/documentos`);
  revalidatePath(`/instalacoes/${installationId}/requisitos`);
  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath("/instalacoes");
}

/**
 * Importação única (item 22): recebe um ou vários arquivos, escolhidos
 * avulsos ou uma pasta inteira, pelo mesmo campo `files`. Título vem do nome
 * do arquivo; os demais dados do documento são opcionais e podem ser
 * preenchidos depois em "Detalhes" (item 21).
 *
 * Arquivos com formato ou tamanho não aceito são pulados (e informados na
 * confirmação) em vez de cancelar a importação inteira.
 */
export async function importDocuments(installationId: string, formData: FormData) {
  const installation = await assertInstallationOwnership(installationId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    throw new Error("Selecione ao menos um arquivo ou uma pasta com arquivos.");
  }

  let imported = 0;
  const skipped: string[] = [];
  for (const file of files) {
    // Arquivos ocultos de sistema que vêm junto ao importar uma pasta.
    const name = path.basename(file.name);
    if (name.startsWith(".") || name.toLowerCase() === "thumbs.db" || name.toLowerCase() === "desktop.ini") continue;
    try {
      await saveDocumentFile(installation.organizationId, installationId, file);
      imported++;
    } catch {
      skipped.push(name);
    }
  }

  revalidateInstallation(installationId);

  if (imported === 0) {
    await flash(`Nenhum arquivo importado. Formato ou tamanho não aceito: ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}`, "warn");
  } else if (skipped.length > 0) {
    await flash(`${imported} arquivo(s) importado(s). ${skipped.length} ignorado(s) por formato ou tamanho.`, "warn");
  } else {
    await flash(imported === 1 ? "Documento importado." : `${imported} documentos importados.`);
  }
}

/** Edição dos dados opcionais do documento (antes exigidos no envio). */
export async function updateDocumentDetails(installationId: string, documentId: string, formData: FormData) {
  await assertInstallationOwnership(installationId);
  await assertDocumentBelongsToInstallation(installationId, documentId);

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const title = text("title");
  if (!title) throw new Error("Informe um título para o documento.");
  const validUntilRaw = text("validUntil");
  const previousVersionId = text("previousVersionId");

  await prisma.documentFile.update({
    where: { id: documentId },
    data: {
      title,
      type: text("type") || "Documento",
      version: text("version") || null,
      areaResponsible: text("areaResponsible") || null,
      confidentiality: text("confidentiality") === "PUBLICO" ? "PUBLICO" : "INTERNO",
      targetAudience: text("targetAudience") || null,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      previousVersionId: previousVersionId && previousVersionId !== documentId ? previousVersionId : null,
    },
  });

  revalidateInstallation(installationId);
  await flash("Dados do documento salvos.");
}

async function assertDocumentBelongsToInstallation(installationId: string, documentId: string) {
  const document = await prisma.documentFile.findUnique({ where: { id: documentId } });
  if (!document || document.installationId !== installationId) {
    throw new Error("Documento não encontrado nesta instalação.");
  }
  return document;
}

export async function deleteDocument(installationId: string, documentId: string) {
  await assertInstallationOwnership(installationId);
  const document = await assertDocumentBelongsToInstallation(installationId, documentId);

  // Ações encerradas com este documento como evidência perdem só o vínculo
  // ao arquivo; o link e a observação de encerramento continuam.
  await prisma.action.updateMany({ where: { closureDocumentId: documentId }, data: { closureDocumentId: null } });
  await prisma.evidence.deleteMany({ where: { documentId } });
  await prisma.documentFile.delete({ where: { id: documentId } });
  await getStorage().delete(document.filePath);

  revalidateInstallation(installationId);
  await flash("Documento excluído.");
}

export async function approveDisclosure(
  installationId: string,
  documentId: string,
  formData: FormData
) {
  await assertInstallationOwnership(installationId);
  await assertDocumentBelongsToInstallation(installationId, documentId);

  const approvedBy = String(formData.get("approvedBy") ?? "").trim();
  if (!approvedBy) throw new Error("Informe quem está aprovando a divulgação.");

  await prisma.documentFile.update({
    where: { id: documentId },
    data: {
      disclosureApproved: true,
      disclosureApprovedBy: approvedBy,
      disclosureApprovedAt: new Date(),
    },
  });

  revalidateInstallation(installationId);
  await flash("Documento aprovado para divulgação.");
}
