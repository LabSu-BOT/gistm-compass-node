import Link from "next/link";
import clsx from "clsx";
import { Sparkles, Search, Check, FileStack, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { resolveLang } from "@/lib/lang";
import { shortTitle, shortPrinciple } from "@/lib/short-titles";
import { ClassificationIcon, CriticalityBars, StatusLegend } from "@/components/StatusIcons";
import { PageHeader, PageBody, Card, EmptyState } from "@/components/ui";
import { CycleSwitcher } from "@/components/CycleSwitcher";
import { SubmitButton } from "@/components/SubmitButton";
import { CriticalityInfo, ClassificationInfo, InfoTip } from "@/components/InfoTip";
import { FilterGroup, ClearFilters, paramValues, type SearchParamsRecord } from "@/components/FilterChips";
import { runAiSimulationForAll, runAiForNewDocuments } from "./actions";
import { latestIncrementalSummary } from "@/lib/incremental-analysis";
import type { FinalClassification, GapCriticality } from "@prisma/client";

export const dynamic = "force-dynamic";

const CLASSIFICATION_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: "ATENDE_TOTALMENTE", label: "Atende", dot: "bg-state-ok" },
  { value: "ATENDE_PARCIALMENTE", label: "Parcial", dot: "bg-[#c2870f]" },
  { value: "NAO_ATENDE", label: "Não atende", dot: "bg-state-bad" },
  { value: "NAO_SE_APLICA", label: "Não se aplica", dot: "bg-mineral-300" },
  { value: "NAO_AVALIADO", label: "Sem análise", dot: "bg-mineral-200" },
];

const CRITICALITY_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: "ALTA", label: "Alta", dot: "bg-state-bad" },
  { value: "MEDIA", label: "Média", dot: "bg-[#c2870f]" },
  { value: "BAIXA", label: "Baixa", dot: "bg-state-ok" },
  { value: "NAO_SE_APLICA", label: "Sem gap", dot: "bg-mineral-300" },
];

const FILTER_KEYS = ["p", "cls", "crit", "st", "q", "theme"];

export default async function RequisitosPage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  const { installationId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = str("q") ?? "";
  const cycleParam = str("cycle");
  const lang = await resolveLang(str("lang"));
  const pick = (pt: string, en: string | null | undefined) => (lang === "en" ? en ?? pt : pt);

  const { installation, cycle, allCycles, isLatestCycle } = await getInstallationContext(
    installationId,
    cycleParam
  );

  const [principles, assessments, documentCount, newDocCount, lastIncremental] = await Promise.all([
    prisma.principle.findMany({
      orderBy: { number: "asc" },
      include: {
        themes: {
          orderBy: { number: "asc" },
          include: { requirements: { orderBy: { code: "asc" } } },
        },
      },
    }),
    prisma.assessment.findMany({ where: { installationId: installation.id, cycleId: cycle.id } }),
    prisma.documentFile.count({ where: { installationId: installation.id } }),
    prisma.documentFile.count({ where: { installationId: installation.id, analyzedAt: null } }),
    latestIncrementalSummary(installation.id, cycle.id),
  ]);
  const assessmentByRequirement = new Map(assessments.map((a) => [a.requirementId, a]));

  // Filtros acumulados (item 14). `theme` continua aceito para os links que
  // vêm da Bússola do Sumário executivo.
  const selPrinciples = paramValues(sp, "p");
  const themeParam = str("theme");
  const selCls = paramValues(sp, "cls");
  const selCrit = paramValues(sp, "crit");
  const selSt = paramValues(sp, "st");
  const query = q.trim().toLowerCase();

  // Busca também no conteúdo das evidências vinculadas.
  let requirementIdsMatchingContent = new Set<string>();
  if (query) {
    const evidences = await prisma.evidence.findMany({
      where: { document: { installationId: installation.id } },
      select: { requirementId: true, excerpt: true, document: { select: { extractedText: true, title: true } } },
    });
    requirementIdsMatchingContent = new Set(
      evidences
        .filter(
          (e) =>
            e.excerpt.toLowerCase().includes(query) ||
            e.document.title.toLowerCase().includes(query) ||
            (e.document.extractedText ?? "").toLowerCase().includes(query)
        )
        .map((e) => e.requirementId)
    );
  }

  const themes = principles.flatMap((p) => p.themes);
  const allRequirements = themes.flatMap((t) => t.requirements);
  const totalRequirements = allRequirements.length;

  // Classificação/criticidade "efetiva": a validada por uma pessoa ou, na
  // falta dela, a sugerida pela IA (marcada com o selo IA na lista).
  const effective = (reqId: string) => {
    const a = assessmentByRequirement.get(reqId);
    const validated = a?.status === "VALIDADO";
    const cls = (validated ? a?.finalClassification : a?.aiClassification) ?? null;
    const crit = (validated ? a?.finalCriticality : a?.aiCriticality) ?? null;
    return {
      a,
      validated,
      review: !!a?.reviewFlag,
      cls: cls as FinalClassification | null,
      crit: crit as GapCriticality | null,
    };
  };

  const validatedCount = assessments.filter((a) => a.status === "VALIDADO").length;
  const aiCount = assessments.filter((a) => a.aiClassification !== null).length;
  const pendingValidation = assessments.filter((a) => a.status === "EM_REVISAO").length;
  const reviewCount = assessments.filter((a) => a.reviewFlag).length;

  const matches = (reqId: string, code: string, title: string, titleEn: string | null, themeId: string, themeNumber: number, opts: { skip?: string } = {}) => {
    const e = effective(reqId);
    const matchesQuery =
      !query ||
      code.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query) ||
      (titleEn ?? "").toLowerCase().includes(query) ||
      requirementIdsMatchingContent.has(reqId);
    const matchesTheme = !themeParam || themeId === themeParam;
    const matchesP = opts.skip === "p" || selPrinciples.length === 0 || selPrinciples.includes(String(themeNumber));
    const matchesCls = opts.skip === "cls" || selCls.length === 0 || selCls.includes(e.cls ?? "NAO_AVALIADO");
    const matchesCrit = opts.skip === "crit" || selCrit.length === 0 || (e.crit !== null && selCrit.includes(e.crit));
    const matchesSt =
      opts.skip === "st" ||
      selSt.length === 0 ||
      selSt.includes(e.validated ? "validado" : "pendente") ||
      (e.review && selSt.includes("rever"));
    return matchesQuery && matchesTheme && matchesP && matchesCls && matchesCrit && matchesSt;
  };

  // Contagem de cada chip considerando os OUTROS filtros já ativos.
  const countWhere = (skip: string, pred: (reqId: string, themeNumber: number) => boolean) =>
    themes.reduce(
      (acc, t) =>
        acc +
        t.requirements.filter(
          (r) => matches(r.id, r.code, r.title, r.titleEn, t.id, t.number, { skip }) && pred(r.id, t.number)
        ).length,
      0
    );

  const visibleThemes = themes
    .map((t) => ({
      ...t,
      requirements: t.requirements.filter((r) => matches(r.id, r.code, r.title, r.titleEn, t.id, t.number)),
    }))
    .filter((t) => t.requirements.length > 0);
  const visibleCount = visibleThemes.reduce((n, t) => n + t.requirements.length, 0);

  const withCycle = cycleParam ? `?cycle=${cycleParam}` : "";

  return (
    <div>
      <PageHeader
        title="Análise"
        description={`${validatedCount}/${totalRequirements} validados`}
        info={
          <InfoTip label="Como funciona a Análise">
            A IA lê a Documentação e sugere uma classificação para cada um dos 77 requisitos do GISTM.
            Cada sugestão precisa ser validada por um revisor técnico antes de virar decisão final.
          </InfoTip>
        }
        action={
          <div className="flex items-center gap-3">
            <CycleSwitcher cycles={allCycles} currentCycleId={cycle.id} />
            {isLatestCycle && aiCount > 0 && newDocCount > 0 && (
              <form action={runAiForNewDocuments.bind(null, installation.id)}>
                <SubmitButton
                  pendingLabel="Analisando…"
                  className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Sparkles size={16} />
                  Analisar novos ({newDocCount})
                </SubmitButton>
              </form>
            )}
            {isLatestCycle && aiCount === 0 && (
              <form action={runAiSimulationForAll.bind(null, installation.id)}>
                <SubmitButton
                  pendingLabel="Analisando…"
                  className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Sparkles size={16} />
                  Rodar análise da IA
                </SubmitButton>
              </form>
            )}
            {isLatestCycle && aiCount > 0 && newDocCount === 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-state-ok-soft px-3 py-1.5 text-xs font-medium text-state-ok">
                <Check size={13} />
                Documentação analisada
              </span>
            )}
            {isLatestCycle && aiCount > 0 && (
              <details className="relative">
                <summary className="btn-secondary cursor-pointer list-none rounded-full [&::-webkit-details-marker]:hidden">
                  <RefreshCw size={14} />
                  Refazer completa
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-mineral-200 bg-white p-4 text-left shadow-[var(--shadow-float)]">
                  <p className="text-sm font-semibold text-mineral-900">Refazer a análise completa?</p>
                  <p className="mt-1 text-xs leading-relaxed text-mineral-600">
                    Refaz as sugestões da IA. Validações são mantidas.
                  </p>
                  <form action={runAiSimulationForAll.bind(null, installation.id)} className="mt-3">
                    <SubmitButton pendingLabel="Analisando…" className="btn-primary">
                      Refazer análise completa
                    </SubmitButton>
                  </form>
                </div>
              </details>
            )}
          </div>
        }
      />

      <PageBody className="space-y-4">
        {!isLatestCycle && (
          <div className="rounded-xl border border-state-warn-line bg-state-warn-soft px-4 py-2.5 text-sm text-state-warn">
            Ciclo encerrado ({cycle.name}) — somente leitura.
          </div>
        )}

        {/* Primeiro uso: passo a passo em vez de uma lista vazia (item 9). */}
        {isLatestCycle && aiCount === 0 && (
          <Card className="px-6 py-6">
            <p className="text-lg font-semibold text-mineral-900">Comece em 3 passos</p>
            <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <StepCard
                n={1}
                done={documentCount > 0}
                title="Importe a documentação"
                text={documentCount > 0 ? `${documentCount} documento(s) na base` : "Arquivos ou uma pasta inteira"}
                href={`/instalacoes/${installation.id}/documentos`}
                cta="Ir para Documentação"
                icon={<FileStack size={16} />}
              />
              <StepCard
                n={2}
                done={false}
                title="Rode a análise da IA"
                text="Uma sugestão para cada requisito"
                cta={
                  <form action={runAiSimulationForAll.bind(null, installation.id)}>
                    <SubmitButton pendingLabel="Analisando…" className="btn-primary">
                      <Sparkles size={14} />
                      Rodar análise
                    </SubmitButton>
                  </form>
                }
              />
              <StepCard n={3} done={false} title="Valide as sugestões" text="Abra cada requisito e confirme" />
            </ol>
          </Card>
        )}

        {isLatestCycle && pendingValidation > 0 && (
          <Link
            href={`/instalacoes/${installation.id}/requisitos?st=pendente${cycleParam ? `&cycle=${cycleParam}` : ""}`}
            className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 hover:bg-brand-100"
          >
            <span>
              <strong>{pendingValidation}</strong> para validar
            </span>
            <span className="flex items-center gap-1 font-medium">
              Ver pendentes <ArrowRight size={14} />
            </span>
          </Link>
        )}

        {/* Resultado da última análise de documentos novos */}
        {lastIncremental && (
          <details open={reviewCount > 0} className="group rounded-2xl border border-mineral-200/80 bg-white shadow-[var(--shadow-card)]">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-semibold text-mineral-900">Última análise de documentos novos</span>
                <span className="block text-xs text-mineral-500">
                  {new Date(lastIncremental.runAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {lastIncremental.documents.length} documento(s) · por {lastIncremental.createdBy}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                  +{lastIncremental.totals.evidenceAdded} evidência(s)
                </span>
                {lastIncremental.totals.flaggedForReview > 0 && (
                  <span className="rounded-full bg-state-warn-soft px-2.5 py-1 font-medium text-state-warn">
                    {lastIncremental.totals.flaggedForReview} para rever
                  </span>
                )}
                {lastIncremental.totals.suggestionChanged > 0 && (
                  <span className="rounded-full bg-mineral-100 px-2.5 py-1 font-medium text-mineral-600">
                    {lastIncremental.totals.suggestionChanged} sugestão(ões) alterada(s)
                  </span>
                )}
              </span>
            </summary>
            <ul className="divide-y divide-mineral-100 border-t border-mineral-100">
              {lastIncremental.documents.map((d) => (
                <li key={d.documentId} className="px-5 py-3 text-sm">
                  <p className="font-medium text-mineral-900">{d.title}</p>
                  {d.noText ? (
                    <p className="mt-0.5 text-xs text-mineral-500">Sem texto lido (imagem ou formato sem extração): nada foi acrescentado.</p>
                  ) : d.evidenceAdded.length === 0 ? (
                    <p className="mt-0.5 text-xs text-mineral-500">Nenhum requisito relacionado: nada foi acrescentado.</p>
                  ) : (
                    <div className="mt-1 space-y-0.5 text-xs text-mineral-600">
                      <p>
                        <span className="font-medium text-brand-700">Evidência acrescentada em:</span> {d.evidenceAdded.join(", ")}
                      </p>
                      {d.flaggedForReview.length > 0 && (
                        <p>
                          <span className="font-medium text-state-warn">Validados para rever:</span> {d.flaggedForReview.join(", ")}
                        </p>
                      )}
                      {d.suggestionChanged.length > 0 && (
                        <p>
                          <span className="font-medium text-mineral-700">Sugestão da IA alterada (não validados):</span>{" "}
                          {d.suggestionChanged.join(", ")}
                        </p>
                      )}
                      <p className="text-mineral-400">Validações existentes não foram alteradas.</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}

        {reviewCount > 0 && (
          <Link
            href={`/instalacoes/${installation.id}/requisitos?st=rever`}
            className="flex items-center justify-between rounded-xl border border-state-warn-line bg-state-warn-soft px-4 py-3 text-sm text-state-warn hover:brightness-95"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>
                <strong>{reviewCount}</strong> para rever (documento novo)
              </span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              Ver <ArrowRight size={14} />
            </span>
          </Link>
        )}

        {/* Filtros (item 14) */}
        <div className="space-y-3 rounded-2xl border border-mineral-200/80 bg-white px-4 py-4 shadow-[var(--shadow-card)]">
          <form method="get" className="flex items-center gap-2">
            {Object.entries(sp).flatMap(([k, v]) =>
              k === "q" || v === undefined
                ? []
                : (Array.isArray(v) ? v : [v]).map((item, i) => (
                    <input key={`${k}-${i}`} type="hidden" name={k} value={item} />
                  ))
            )}
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mineral-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar"
                className="input rounded-full pl-9"
              />
            </div>
          </form>

          <FilterGroup
            label="Princípio"
            paramKey="p"
            params={sp}
            options={themes.map((t) => ({
              value: String(t.number),
              label: String(t.number),
              title: shortPrinciple(t.number, pick(t.name, t.nameEn), lang),
              count: countWhere("p", (_id, n) => n === t.number),
            }))}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <FilterGroup
              label="Classificação"
              paramKey="cls"
              params={sp}
              info={<ClassificationInfo />}
              options={CLASSIFICATION_OPTIONS.map((o) => ({
                ...o,
                count: countWhere("cls", (id) => (effective(id).cls ?? "NAO_AVALIADO") === o.value),
              }))}
            />
            <FilterGroup
              label="Criticidade"
              paramKey="crit"
              params={sp}
              info={<CriticalityInfo />}
              options={CRITICALITY_OPTIONS.map((o) => ({
                ...o,
                count: countWhere("crit", (id) => effective(id).crit === o.value),
              }))}
            />
            <FilterGroup
              label="Situação"
              paramKey="st"
              params={sp}
              options={[
                { value: "validado", label: "Validados", count: countWhere("st", (id) => effective(id).validated) },
                { value: "pendente", label: "Não validados", count: countWhere("st", (id) => !effective(id).validated) },
                ...(reviewCount > 0
                  ? [{ value: "rever", label: "Rever", dot: "bg-[#c2870f]", count: countWhere("st", (id) => effective(id).review) }]
                  : []),
              ]}
            />
            <ClearFilters params={sp} keys={FILTER_KEYS} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-xs font-medium text-mineral-600">
            {visibleCount}/{totalRequirements}
          </p>
          <StatusLegend />
        </div>

        {visibleThemes.length === 0 ? (
          <Card>
            <EmptyState>Nenhum requisito com esses filtros.</EmptyState>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleThemes.map((theme) => (
              <Card key={theme.id} className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-mineral-100 bg-mineral-50/60 px-5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                    {theme.number}
                  </span>
                  <p className="truncate text-sm font-semibold text-mineral-800" title={pick(theme.name, theme.nameEn)}>
                    {shortPrinciple(theme.number, pick(theme.name, theme.nameEn), lang)}
                  </p>
                </div>
                <ul className="divide-y divide-mineral-100">
                  {theme.requirements.map((req) => {
                    const e = effective(req.id);
                    return (
                      <li key={req.id}>
                        <Link
                          href={`/instalacoes/${installation.id}/requisitos/${req.id}${withCycle}`}
                          className="flex items-center gap-3 px-5 py-2.5 hover:bg-mineral-50"
                          title={pick(req.title, req.titleEn)}
                        >
                          <ClassificationIcon value={e.cls} validated={e.validated} />
                          <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-mineral-500">{req.code}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-mineral-800">
                            {shortTitle(req.code, pick(req.title, req.titleEn), lang)}
                          </span>
                          {e.review && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-state-warn-soft px-2 py-0.5 text-[11px] font-semibold text-state-warn ring-1 ring-inset ring-state-warn-line"
                              title={e.a?.reviewFlag ?? undefined}
                            >
                              <AlertTriangle size={11} />
                              Rever
                            </span>
                          )}
                          <CriticalityBars value={e.crit} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}

function StepCard({
  n,
  done,
  title,
  text,
  href,
  cta,
  icon,
}: {
  n: number;
  done: boolean;
  title: string;
  text: string;
  href?: string;
  cta?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-mineral-200 bg-mineral-50/50 p-4">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
            done ? "bg-state-ok text-white" : "bg-brand-50 text-brand-600"
          )}
        >
          {done ? <Check size={14} /> : n}
        </span>
        <p className="text-sm font-semibold text-mineral-900">{title}</p>
      </div>
      <p className="text-xs text-mineral-500">{text}</p>
      {href && typeof cta === "string" ? (
        <Link href={href} className="btn-secondary mt-auto w-fit">
          {icon}
          {cta}
        </Link>
      ) : (
        cta && <div className="mt-auto">{cta}</div>
      )}
    </li>
  );
}
