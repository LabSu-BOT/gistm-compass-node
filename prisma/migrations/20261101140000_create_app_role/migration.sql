-- Role da aplicação sem BYPASSRLS / sem superuser.
-- Migrations e seed continuam com o role dono (gistm); a app usa gistm_app.

DO $$
BEGIN
  CREATE ROLE gistm_app LOGIN PASSWORD 'gistm' NOSUPERUSER NOBYPASSRLS;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

GRANT USAGE ON SCHEMA public TO gistm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gistm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gistm_app;
GRANT EXECUTE ON FUNCTION app_current_org_id() TO gistm_app;
GRANT EXECUTE ON FUNCTION app_rls_bypass() TO gistm_app;
GRANT EXECUTE ON FUNCTION app_rls_open() TO gistm_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gistm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO gistm_app;
