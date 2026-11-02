<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GISTM Compass — contexto para agentes

Plataforma multi-tenant (MGLS) de conformidade com o **GISTM**: catálogo oficial (6 tópicos / 15 princípios / 77 requisitos), documentos, avaliação assistida por IA com validação humana, plano de ação, ciclos e painéis.

## Stack

Next.js **16.2** + React 19 + Prisma 6 (SQLite local) + NextAuth v5 (Credentials/JWT) + Tailwind v4 + Anthropic (opcional).

## Onde está o quê

| Tema | Caminho |
|------|---------|
| App Router + Server Actions | `src/app/` |
| Ownership / ciclo | `src/lib/context.ts` |
| Upload | `src/lib/upload-limits.ts` |
| Assessment helper | `src/lib/assessments.ts` |
| IA | `src/lib/ai-agent.ts`, `ai-evidence.ts`, `ai-chat.ts`, `ai-simulator.ts` |
| UI kit + tokens | `src/components/ui.tsx`, `src/app/globals.css` |
| Auth | `src/auth.ts`, `src/types/next-auth.d.ts` |
| Schema + conteúdo GISTM | `prisma/schema.prisma`, `prisma/gistm-content.ts` |
| Storage (local/S3) | `src/lib/storage.ts` |
| RLS / tenant DB | `src/lib/tenant-db.ts`, migrations `enable_tenant_rls` |
| Signup gate | `src/lib/signup-policy.ts` (`ALLOW_PUBLIC_SIGNUP`) |
| Regras Cursor (detalhe) | `.cursor/rules/*.mdc` |
| Agent Claude | `.claude/agents/gistm-dev.md` |

## Checklist ao editar código

1. Ler docs locais do Next 16 antes de APIs novas.
2. `params` / `searchParams` são `Promise` — sempre `await`.
3. Actions de instalação: `assertInstallationOwnership` (ou `getInstallationContext` em páginas). Cross-org → **404**.
4. Recurso filho (documento, assessment, action): confirmar `installationId` depois do ownership.
5. Upload: `assertUploadAllowed` + nome `randomUUID()+ext` em `uploads/`.
6. Download/serving: sessão + 404 se org diferente.
7. Roles: só `ADMIN` \| `MEMBER`; espelhar `organizacao/usuarios/actions.ts` para gates ADMIN.
8. Manter `trustHost: true`; `npm run dev` em `127.0.0.1`.
9. Preferir Server Actions colocalizadas; Route Handlers só auth + arquivo.
10. UI: kit existente + paleta petróleo/mineral — não introduzir shadcn.
11. Assessment: IA sugere; humano valida; não gravar decisão final só com IA.
12. Comentários em português só quando o "porquê" não for óbvio.
13. Após mudanças: `npx tsc --noEmit`.
14. Postgres local: `docker compose up -d`; migrate/seed via `npm run db:migrate` / `npm run db:seed` (`DATABASE_ADMIN_URL`). App usa `gistm_app` (`DATABASE_URL`).

## Domínio (resumo)

- Prisma: `Principle` = tópico GISTM; `Theme` = princípio GISTM.
- `Installation` = estrutura/facility; contexto pela URL `/instalacoes/[installationId]`.
- `Assessment` único por requirement + installation + cycle; campos `ai*` vs `final*`.
