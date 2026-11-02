"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/text-extraction";
import { assertInstallationOwnership } from "@/lib/context";
import { assertUploadAllowed } from "@/lib/upload-limits";
import { buildObjectKey, getStorage } from "@/lib/storage";

function revalidateInstallation(installationId: string) {
  revalidatePath(`/instalacoes/${installationId}/documentos`);
  revalidatePath(`/instalacoes/${installationId}/requisitos`);
  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath("/instalacoes");
}

export async function uploadDocument(installationId: string, formData: FormData) {
  const installation = await assertInstallationOwnership(installationId);

  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const areaResponsible = String(formData.get("areaResponsible") ?? "").trim();
  const confidentiality = String(formData.get("confidentiality") ?? "INTERNO");
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const validUntilRaw = String(formData.get("validUntil") ?? "");
  const previousVersionId = String(formData.get("previousVersionId") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione um arquivo para enviar.");
  }
  if (!title) {
    throw new Error("Informe um título para o documento.");
  }

  const ext = path.extname(file.name).toLowerCase();
  assertUploadAllowed(file, ext);

  const objectKey = buildObjectKey(installation.organizationId, installationId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const storage = getStorage();
  await storage.put(objectKey, buffer, mimeType);

  const extractedText = await extractText(buffer, ext);

  await prisma.documentFile.create({
    data: {
      title,
      type: type || "Documento",
      version: version || null,
      areaResponsible: areaResponsible || null,
      confidentiality,
      targetAudience: targetAudience || null,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      previousVersionId: previousVersionId || null,
      fileName: file.name,
      filePath: objectKey,
      mimeType,
      extractedText,
      installationId,
    },
  });

  revalidateInstallation(installationId);
}

export async function importFolder(installationId: string, formData: FormData) {
  const installation = await assertInstallationOwnership(installationId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const type = String(formData.get("type") ?? "").trim() || "Outro";
  const areaResponsible = String(formData.get("areaResponsible") ?? "").trim();
  const confidentiality = String(formData.get("confidentiality") ?? "INTERNO");

  if (files.length === 0) {
    throw new Error("Selecione uma pasta que contenha ao menos um arquivo.");
  }

  for (const file of files) {
    assertUploadAllowed(file, path.extname(file.name).toLowerCase());
  }

  const storage = getStorage();

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    const objectKey = buildObjectKey(installation.organizationId, installationId, ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    await storage.put(objectKey, buffer, mimeType);

    const extractedText = await extractText(buffer, ext);
    const title = path.basename(file.name, ext);

    await prisma.documentFile.create({
      data: {
        title,
        type,
        areaResponsible: areaResponsible || null,
        confidentiality,
        fileName: file.name,
        filePath: objectKey,
        mimeType,
        extractedText,
        installationId,
      },
    });
  }

  revalidateInstallation(installationId);
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

  await prisma.evidence.deleteMany({ where: { documentId } });
  await prisma.documentFile.delete({ where: { id: documentId } });
  await getStorage().delete(document.filePath);

  revalidateInstallation(installationId);
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
}
