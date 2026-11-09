import { spawnSync } from "node:child_process";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile();

// Migrations precisam do role dono/superuser; a app usa gistm_app (sem bypass RLS).
const adminUrl = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!adminUrl) {
  console.error("Defina DATABASE_ADMIN_URL (ou DATABASE_URL) para rodar migrations.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: adminUrl },
  shell: true,
});

process.exit(result.status ?? 1);
