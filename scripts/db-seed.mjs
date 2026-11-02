import { spawnSync } from "node:child_process";

// Seed usa o role admin (bypass natural de superuser + set_config de segurança).
const adminUrl = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!adminUrl) {
  console.error("Defina DATABASE_ADMIN_URL (ou DATABASE_URL) para rodar o seed.");
  process.exit(1);
}

const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: adminUrl },
  shell: true,
});

process.exit(result.status ?? 1);
