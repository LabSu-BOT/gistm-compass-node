# GISTM Compass

Plataforma de gestão da conformidade com o GISTM (*Global Industry Standard on
Tailings Management*): base de requisitos, gestão documental, avaliação de
evidências assistida por IA com validação técnica humana, plano de ação, ciclos
de avaliação e painéis executivo e técnico.

Produto da **MGLS**.

## Visão geral

A plataforma organiza a conformidade de estruturas de disposição de rejeitos
em torno dos 77 requisitos do GISTM. Para cada estrutura, a equipe reúne a base
documental, avalia requisito a requisito com apoio de IA, registra o plano de
ação e acompanha a evolução por ciclos — com trilha de auditoria e relatórios
prontos para diretoria e auditores. A decisão final é sempre do revisor
técnico; a IA acelera a leitura, não substitui o julgamento.

## Principais recursos

- **Base de requisitos GISTM** — 6 tópicos, 15 princípios e 77 requisitos com o
  texto oficial do Padrão em português e inglês, com alternância PT/EN.
- **Avaliação por requisito** — classificação, robustez da evidência,
  criticidade do gap e suficiência de informação, com validação humana
  obrigatória, histórico estruturado de decisões, trilha de auditoria e
  biblioteca de justificativas reutilizáveis.
- **Leitura assistida por IA** — um agente consulta a base documental da
  estrutura por completo (localiza, lê os documentos na íntegra, cruza
  informações e cita as fontes) para sugerir a avaliação e responder perguntas
  no assistente. Uma heurística determinística serve de fallback.
- **Gestão documental** — upload com metadados (tipo, versão, validade,
  confidencialidade, público), versionamento, importação de pasta, busca por
  conteúdo e extração de texto de `.pdf`, `.docx`, `.xlsx`, `.txt` e `.md`.
- **Plano de ação** — quadro por status com prioridade, prazo, dependência
  entre ações, evidência de encerramento e histórico de progresso.
- **Ciclos de avaliação** — encerramento de ciclo, modo somente-leitura e
  comparação de evolução entre ciclos.
- **Painéis** — executivo e técnico, Bússola GISTM com Índice de Prontidão para
  Auditoria, comparação entre instalações e relatório imprimível (resumido ou
  completo), além do pacote de divulgação pública.
- **Multi-tenant** — cada organização só enxerga as próprias estruturas; papéis
  ADMIN/MEMBER e proteção contra força bruta no login.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS** — front-end e
  back-end no mesmo projeto, com Server Actions nas mutações.
- **Prisma** + **PostgreSQL** (Docker local na porta `5433`; VPS em produção).
- **NextAuth (Auth.js v5)** — autenticação por credenciais e multi-tenant.
- **Storage** — pasta `uploads/` em dev (`STORAGE_DRIVER=local`) ou S3-compatível
  em produção (`STORAGE_DRIVER=s3`, ex. Azure Blob).
- **Anthropic API** — camada de IA agêntica (`src/lib/ai-agent.ts`).

## Executando localmente

Pré-requisitos: Node.js 20+ e Docker.

```bash
npm install
docker compose up -d
cp .env.example .env      # AUTH_SECRET, opcionalmente ANTHROPIC_API_KEY
npm run db:migrate
npx prisma generate
npm run db:seed
npm run dev
```

Acesse [http://127.0.0.1:3000](http://127.0.0.1:3000). Login de demonstração:
`demo@gistmcompass.com` / `demo12345`. Com `ALLOW_PUBLIC_SIGNUP=true` (padrão
do `.env.example`), também dá para criar organização em `/cadastro`.

O recurso de IA exige `ANTHROPIC_API_KEY`; o restante funciona sem ela.

### Dados de demonstração

Para redefinir o Postgres local ao estado limpo:

```bash
npm run db:seed
```

Para um cenário mais rico (estruturas em diferentes estágios de maturidade):

```bash
npx tsx scripts/seed-test-documents.mjs
npx tsx scripts/seed-demo-story.mjs
```

## Conteúdo oficial do GISTM

`prisma/gistm-content.ts` é a fonte única do texto oficial (PT/EN), transcrito
dos PDFs do Padrão e consumido por `prisma/seed.ts`. Alguns requisitos (3.4,
5.6, 5.8, 10.7 e 15.1) reúnem mais de um parágrafo do original; a
correspondência foi conferida cruzando as citações internas do próprio Padrão.
Para atualizar (ex.: uma revisão do GISTM), edite esse arquivo e rode o seed
novamente.

## Arquitetura e segurança

- **Isolamento entre organizações** — toda página e Server Action escopada por
  estrutura passa por `getInstallationContext` / `assertInstallationOwnership`
  (`src/lib/context.ts`), que exige sessão válida e confirma a propriedade;
  acesso cruzado retorna 404.
- **Validação humana** — a sugestão da IA nunca vira avaliação definitiva sem
  confirmação de um revisor; cada decisão gera snapshot e trilha de auditoria.
- **IA ancorada nos documentos** — o agente responde apenas com base no
  conteúdo da base documental e cita as fontes; quando não encontra, diz
  explicitamente em vez de inventar.

## Qualidade

Scripts de verificação ponta-a-ponta (Playwright) em `scripts/smoke-test-*.mjs`
cobrem autenticação e isolamento entre organizações, avaliação, documentos,
plano de ação, ciclos, painéis, i18n e o assistente. Executam contra o
servidor local.

## Status e próximos passos

Base de produção (Prioridade 1) já no repo: Postgres + índices, RLS por org,
middleware de auth, cadastro gated por env e storage local/S3.

Ainda previstos:

- Autenticação corporativa (**SSO/AD**), verificação e convite por e-mail.
- Jobs assíncronos para IA/extração e quotas por organização.
- Rotina de **backup** e monitoramento.
- Adequação à **LGPD** para o tratamento de dados dos clientes. 
