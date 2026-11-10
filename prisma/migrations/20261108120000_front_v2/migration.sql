-- Front v2: cadastro completo da estrutura, código e evidência de
-- encerramento das ações, e análise incremental (só documentos novos).

-- CreateEnum
CREATE TYPE "InstallationPhase" AS ENUM ('NOVA', 'EM_CONSTRUCAO', 'OPERACAO', 'INATIVA', 'FECHAMENTO');

-- AlterTable: cadastro da estrutura (itens 10 e 11)
ALTER TABLE "Installation"
    ADD COLUMN "location" TEXT,
    ADD COLUMN "phase" "InstallationPhase" NOT NULL DEFAULT 'OPERACAO',
    ADD COLUMN "hasDpaClassification" BOOLEAN,
    ADD COLUMN "dpaClassification" TEXT,
    ADD COLUMN "eorName" TEXT,
    ADD COLUMN "eorCompany" TEXT,
    ADD COLUMN "eorEmail" TEXT,
    ADD COLUMN "rtfeName" TEXT,
    ADD COLUMN "accountableExecutive" TEXT,
    ADD COLUMN "otherResponsibles" TEXT;

-- AlterTable: documento novo = ainda não analisado pela IA (item 28)
ALTER TABLE "DocumentFile" ADD COLUMN "analyzedAt" TIMESTAMP(3);

-- AlterTable: aviso "Rever" em requisito validado (item 28)
ALTER TABLE "Assessment"
    ADD COLUMN "reviewFlag" TEXT,
    ADD COLUMN "reviewFlagAt" TIMESTAMP(3);

-- AlterTable: código PA-001 e evidência de encerramento (itens 16 e 19)
ALTER TABLE "Action"
    ADD COLUMN "code" TEXT,
    ADD COLUMN "closureDocumentId" TEXT,
    ADD COLUMN "closureLink" TEXT;

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "summaryJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRun_installationId_cycleId_idx" ON "AnalysisRun"("installationId", "cycleId");

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_closureDocumentId_fkey" FOREIGN KEY ("closureDocumentId") REFERENCES "DocumentFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Dados existentes: documentos de estruturas que já passaram pela IA contam
-- como analisados, para não aparecerem todos como "novos" após a atualização.
UPDATE "DocumentFile" d
SET "analyzedAt" = d."uploadedAt"
WHERE EXISTS (
  SELECT 1 FROM "Assessment" a
  WHERE a."installationId" = d."installationId" AND a."aiClassification" IS NOT NULL
);

-- RLS: mesmo isolamento por organização das demais tabelas da instalação.
ALTER TABLE "AnalysisRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS analysis_run_tenant ON "AnalysisRun";
CREATE POLICY analysis_run_tenant ON "AnalysisRun"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "AnalysisRun"."installationId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "AnalysisRun"."installationId" AND i."organizationId" = app_current_org_id()
    )
  );

-- Permissões do role da aplicação (o default privileges já cobre, mas fica
-- explícito caso a migration rode com outro dono).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gistm_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "AnalysisRun" TO gistm_app;
  END IF;
END
$$;
