# GISTM Compass — como rodar (desenvolvimento)

## Pré-requisitos
- Node.js 20.9+ (24 LTS ok)
- Docker (Postgres local via `docker compose`)

## Passos
1. Abra um terminal na pasta `gistm-compass` e rode:
       npm install
2. Suba o banco:
       docker compose up -d
3. Copie `.env.example` para `.env` e preencha (principalmente `AUTH_SECRET` e, se for usar IA, `ANTHROPIC_API_KEY`).
   - `DATABASE_URL` → role `gistm_app` em `127.0.0.1:5434` (sujeito a RLS).
   - `DATABASE_ADMIN_URL` → role `gistm` (migrations/seed).
   - `ALLOW_PUBLIC_SIGNUP=true` libera `/cadastro` no dev; em produção use `false`.
   - `STORAGE_DRIVER=local` grava em `uploads/`; em produção use `s3` + variáveis `S3_*`.
4. Aplique migrations e gere o client:
       npm run db:migrate
       npx prisma generate
5. (Opcional) dados de demonstração:
       npm run db:seed
6. Suba a plataforma:
       npm run dev
7. Abra http://127.0.0.1:3000

## Acesso de demonstração (após seed)
- demo@gistmcompass.com / demo12345

Com `ALLOW_PUBLIC_SIGNUP=true`, também é possível criar uma organização nova em `/cadastro`.

Observação: o Assistente de IA e a "Simular leitura por IA" só funcionam com
uma `ANTHROPIC_API_KEY` válida no `.env`; o resto da plataforma funciona sem ela.

## Produção (VPS)
- Aponte `DATABASE_URL` para o Postgres da VPS.
- `ALLOW_PUBLIC_SIGNUP=false`
- `STORAGE_DRIVER=s3` com endpoint compatível (ex.: Azure Blob S3 API)
- Defina `AUTH_SECRET` forte e `AUTH_URL` com a URL pública HTTPS
- Reverse proxy deve terminar TLS e encaminhar `Host` / `X-Forwarded-*` (`trustHost: true` no NextAuth)
