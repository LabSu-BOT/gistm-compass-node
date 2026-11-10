# Ajustes de front - rev. 2

Feito em cima do main atual. Não rodei npm aqui, então antes de subir rodar:

```
npm ci
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
npm run db:migrate
```

A migration nova é a `20261108120000_front_v2` (colunas novas e tabela AnalysisRun, com RLS). Testei ela num Postgres local.

## O que mudou

1. Sumário (antigo Painel) agora mostra os dados mesmo antes de validar, usando a sugestão da IA. O índice de prontidão continua só com o que foi validado.
2. Inglês: o idioma fica salvo num cookie e não se perde ao trocar de aba.
3. Lentidão: análise da IA em lotes paralelos, uma consulta duplicada removida e telas de carregamento.
4. Menu lateral virou menu horizontal no topo.
5. Abas renomeadas: Sumário executivo, Análise e Documentação. As rotas são as mesmas.
6. Assistente virou um botão flutuante no canto.
7. Aviso de confirmação no topo depois de cada ação (importar, validar, criar ação etc.).
8. Menos texto nas telas, com ícones "i" e seções recolhidas.
9. Botão "Rodar análise da IA" no topo da Análise e passo a passo no primeiro uso.
10. Cadastro com EoR, RTFE, Executivo Responsável e outras pessoas. Aba nova "Dados da estrutura".
11. Classificação DPA (sim/não e classe).
12. Fase da estrutura. Se for Nova ou Em construção, os requisitos só para estruturas existentes ficam como "Não se aplica" (sugestão).
13. Requisitos com subdivisões aparecem como itens a, b, c.
14. Filtros da Análise que se somam (princípio, classificação, criticidade, situação).
15. Ícone "i" com os critérios de criticidade, classificação e robustez.
16. Código das ações (PA-001, PA-002...).
17. Filtros dos planos de ação.
18. Cores por status: vermelho não iniciada, amarelo em andamento, verde concluída.
19. Para concluir uma ação precisa de documento e link.
20. Saiu o quadro "Ações sugeridas pendentes".
21. Saiu o painel da esquerda na Documentação. Os campos viraram opcionais.
22. Um botão só de Importar, para arquivos ou pasta.
23. Ícone por tipo de arquivo.
24. Filtros por ano e extensão na Documentação.
25. Sumário e relatório usam a sugestão da IA quando ainda não tem validação, com o selo "IA".
26. Botão de PDF no relatório e atalho no Sumário.
27. Telas redesenhadas, mantendo as cores.
28. Documento novo não refaz a análise toda. Só os documentos novos são lidos, nada é apagado e requisito já validado não muda, só ganha o aviso "Rever".

Também entrou:
- Títulos curtos dos 77 requisitos e 15 princípios, ícones de status e um mapa dos requisitos no Sumário.
- Régua de avaliação mais rigorosa (`src/lib/assessment-rubric.ts`): "Atende" só com evidência formal da estrutura e em vigor. A IA avalia item por item (a, b, c). Requisitos 14.2 a 14.5 ficam como "Não se aplica".

## Banco

- Installation: location, phase, campos de DPA, EoR, RTFE, executivo e outros responsáveis.
- Action: code, closureDocumentId e closureLink.
- DocumentFile.analyzedAt, Assessment.reviewFlag e a tabela AnalysisRun.
- Estruturas que já existem ficam como "Em operação".

## Para a equipe conferir

- Lista de requisitos só para estruturas existentes (`src/lib/applicability.ts`): 1.1, 3.3, 4.7, 5.2, 5.8.
- Textos dos critérios (`src/lib/criteria.ts`) e títulos curtos (`src/lib/short-titles.ts`).
- Se a conclusão da ação precisa mesmo de link sempre.

## Como testar

1. Cadastrar uma estrutura com fase Nova e ver os 5 requisitos como "Não se aplica".
2. Importar arquivos e uma pasta na Documentação. Testar os filtros.
3. Rodar a análise da IA e ver o Sumário preenchido antes de validar.
4. Combinar filtros na Análise e abrir o requisito 4.2 para ver os itens a, b, c, d.
5. Validar um requisito com e sem justificativa.
6. Criar uma ação, iniciar e concluir (sem link deve dar erro).
7. Trocar para EN e navegar pelas abas.
8. Gerar o PDF pelo Sumário e pelo relatório.
9. Mudar a fase da estrutura e ver o "Não se aplica" sumir e voltar.
10. Com requisitos validados, importar um documento novo, clicar em "Analisar documentos novos" e conferir que as validações não mudaram e que aparece o "Rever" onde faz sentido.
11. Olhar no celular.
