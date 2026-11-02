-- RLS multi-tenant: isolamento complementar aos helpers de aplicação.
-- Quando app.current_org_id está definido, só enxerga a org correspondente.
-- Quando vazio (ou app.rls_bypass=on), permite acesso — necessário para
-- login/cadastro/seed e páginas ainda não envelopadas em withOrgContext.
-- FORCE faz o owner da tabela também respeitar as políticas.

CREATE OR REPLACE FUNCTION app_current_org_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_org_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app_rls_bypass() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.rls_bypass', true) = 'on';
$$;

CREATE OR REPLACE FUNCTION app_rls_open() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_rls_bypass() OR app_current_org_id() IS NULL;
$$;

-- Organization
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organization_tenant ON "Organization";
CREATE POLICY organization_tenant ON "Organization"
  FOR ALL
  USING (app_rls_open() OR id = app_current_org_id())
  WITH CHECK (app_rls_open() OR id = app_current_org_id());

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_tenant ON "User";
CREATE POLICY user_tenant ON "User"
  FOR ALL
  USING (app_rls_open() OR "organizationId" = app_current_org_id())
  WITH CHECK (app_rls_open() OR "organizationId" = app_current_org_id());

-- Installation
ALTER TABLE "Installation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Installation" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS installation_tenant ON "Installation";
CREATE POLICY installation_tenant ON "Installation"
  FOR ALL
  USING (app_rls_open() OR "organizationId" = app_current_org_id())
  WITH CHECK (app_rls_open() OR "organizationId" = app_current_org_id());

-- Cycle
ALTER TABLE "Cycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cycle" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cycle_tenant ON "Cycle";
CREATE POLICY cycle_tenant ON "Cycle"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "Cycle"."installationId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "Cycle"."installationId" AND i."organizationId" = app_current_org_id()
    )
  );

-- DocumentFile
ALTER TABLE "DocumentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFile" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_tenant ON "DocumentFile";
CREATE POLICY document_tenant ON "DocumentFile"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "DocumentFile"."installationId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "DocumentFile"."installationId" AND i."organizationId" = app_current_org_id()
    )
  );

-- Evidence (via documento → instalação)
ALTER TABLE "Evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evidence" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evidence_tenant ON "Evidence";
CREATE POLICY evidence_tenant ON "Evidence"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "DocumentFile" d
      JOIN "Installation" i ON i.id = d."installationId"
      WHERE d.id = "Evidence"."documentId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "DocumentFile" d
      JOIN "Installation" i ON i.id = d."installationId"
      WHERE d.id = "Evidence"."documentId" AND i."organizationId" = app_current_org_id()
    )
  );

-- Assessment
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assessment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_tenant ON "Assessment";
CREATE POLICY assessment_tenant ON "Assessment"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "Assessment"."installationId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "Assessment"."installationId" AND i."organizationId" = app_current_org_id()
    )
  );

-- Comment
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comment_tenant ON "Comment";
CREATE POLICY comment_tenant ON "Comment"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "Comment"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "Comment"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  );

-- AssessmentRevision
ALTER TABLE "AssessmentRevision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentRevision" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_revision_tenant ON "AssessmentRevision";
CREATE POLICY assessment_revision_tenant ON "AssessmentRevision"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "AssessmentRevision"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "AssessmentRevision"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  );

-- Action
ALTER TABLE "Action" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Action" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS action_tenant ON "Action";
CREATE POLICY action_tenant ON "Action"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "Action"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "Action"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  );

-- ActionComment
ALTER TABLE "ActionComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionComment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS action_comment_tenant ON "ActionComment";
CREATE POLICY action_comment_tenant ON "ActionComment"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Action" act
      JOIN "Assessment" a ON a.id = act."assessmentId"
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE act.id = "ActionComment"."actionId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Action" act
      JOIN "Assessment" a ON a.id = act."assessmentId"
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE act.id = "ActionComment"."actionId" AND i."organizationId" = app_current_org_id()
    )
  );

-- ActionLog
ALTER TABLE "ActionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS action_log_tenant ON "ActionLog";
CREATE POLICY action_log_tenant ON "ActionLog"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Action" act
      JOIN "Assessment" a ON a.id = act."assessmentId"
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE act.id = "ActionLog"."actionId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Action" act
      JOIN "Assessment" a ON a.id = act."assessmentId"
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE act.id = "ActionLog"."actionId" AND i."organizationId" = app_current_org_id()
    )
  );

-- ExternalAnalysis
ALTER TABLE "ExternalAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExternalAnalysis" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS external_analysis_tenant ON "ExternalAnalysis";
CREATE POLICY external_analysis_tenant ON "ExternalAnalysis"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "ExternalAnalysis"."installationId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1 FROM "Installation" i
      WHERE i.id = "ExternalAnalysis"."installationId" AND i."organizationId" = app_current_org_id()
    )
  );

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_tenant ON "AuditLog";
CREATE POLICY audit_log_tenant ON "AuditLog"
  FOR ALL
  USING (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "AuditLog"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_open()
    OR EXISTS (
      SELECT 1
      FROM "Assessment" a
      JOIN "Installation" i ON i.id = a."installationId"
      WHERE a.id = "AuditLog"."assessmentId" AND i."organizationId" = app_current_org_id()
    )
  );
