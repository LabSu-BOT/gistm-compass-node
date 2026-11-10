import type { ReactNode } from "react";
import clsx from "clsx";
import type {
  EvidenceRobustness,
  FinalClassification,
  GapCriticality,
  InfoSufficiency,
} from "@prisma/client";

/**
 * Cabeçalho de página. Não é mais fixo no topo: quem fica fixo agora é o menu
 * horizontal (TopNav). Título grande, descrição em uma linha e, à direita, a
 * ação principal da tela.
 */
export function PageHeader({
  title,
  description,
  action,
  toolbar,
  info,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Barra de filtros/abas logo abaixo do título. */
  toolbar?: ReactNode;
  /** Explicação longa escondida atrás de um ícone "i" ao lado do título. */
  info?: ReactNode;
}) {
  return (
    <div className="print:bg-white">
      <div className="content-shell flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-7 pb-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-mineral-900" style={{ fontSize: "1.75rem" }}>
            {title}
            {info}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl truncate text-mineral-500" style={{ fontSize: "var(--text-small)" }}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {toolbar && <div className="content-shell pb-2">{toolbar}</div>}
    </div>
  );
}

/**
 * Corpo da página — mesma faixa de largura e o mesmo respiro lateral do
 * PageHeader, para os dois ficarem alinhados na mesma coluna em qualquer
 * largura de tela.
 */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("content-shell pt-2 pb-10", className)}>{children}</div>
  );
}

/**
 * Grade dos indicadores do topo. Cresce de 1 → 2 → 4 colunas: em 4 colunas
 * fixas (o que havia antes) os rótulos longos como "Gaps de criticidade alta"
 * quebravam em três linhas num notebook estreito.
 */
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-mineral-200/80 bg-white shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-mineral-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-mineral-900">{title}</h2>
        {subtitle && <p className="text-xs text-mineral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-mineral-500">
      {children}
    </div>
  );
}

// --- Badges de status -------------------------------------------------

const CLASSIFICATION_STYLES: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "bg-state-ok-soft text-state-ok ring-1 ring-inset ring-state-ok-line",
  ATENDE_PARCIALMENTE: "bg-state-warn-soft text-state-warn ring-1 ring-inset ring-state-warn-line",
  NAO_ATENDE: "bg-state-bad-soft text-state-bad ring-1 ring-inset ring-state-bad-line",
  NAO_SE_APLICA: "bg-mineral-100 text-mineral-500 ring-1 ring-inset ring-mineral-200",
};

const CLASSIFICATION_TEXT: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "Atende totalmente",
  ATENDE_PARCIALMENTE: "Atende parcialmente",
  NAO_ATENDE: "Não atende",
  NAO_SE_APLICA: "Não se aplica",
};

export function ClassificationBadge({
  value,
}: {
  value: FinalClassification | null | undefined;
}) {
  if (!value) {
    return (
      <span className="inline-flex items-center rounded-full bg-mineral-100 px-2.5 py-1 text-xs font-medium text-mineral-500 ring-1 ring-inset ring-mineral-200">
        Não avaliado
      </span>
    );
  }
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        CLASSIFICATION_STYLES[value]
      )}
    >
      {CLASSIFICATION_TEXT[value]}
    </span>
  );
}

const ROBUSTNESS_TEXT: Record<EvidenceRobustness, string> = {
  ROBUSTA: "Robusta",
  PARCIAL: "Parcial",
  FRACA: "Fraca",
  AUSENTE: "Ausente",
};

export function RobustnessBadge({
  value,
}: {
  value: EvidenceRobustness | null | undefined;
}) {
  if (!value) return <span className="text-xs text-mineral-500">—</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-mineral-100 px-2.5 py-1 text-xs font-medium text-mineral-600 ring-1 ring-inset ring-mineral-200">
      {ROBUSTNESS_TEXT[value]}
    </span>
  );
}

const CRITICALITY_STYLES: Record<GapCriticality, string> = {
  ALTA: "bg-state-bad-soft text-state-bad ring-1 ring-inset ring-state-bad-line",
  MEDIA: "bg-state-warn-soft text-state-warn ring-1 ring-inset ring-state-warn-line",
  BAIXA: "bg-state-ok-soft text-state-ok ring-1 ring-inset ring-state-ok-line",
  NAO_SE_APLICA: "bg-mineral-100 text-mineral-500 ring-1 ring-inset ring-mineral-200",
};

const CRITICALITY_TEXT: Record<GapCriticality, string> = {
  ALTA: "Criticidade alta",
  MEDIA: "Criticidade média",
  BAIXA: "Criticidade baixa",
  NAO_SE_APLICA: "Sem gap",
};

export function CriticalityBadge({
  value,
}: {
  value: GapCriticality | null | undefined;
}) {
  if (!value) return <span className="text-xs text-mineral-500">—</span>;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        CRITICALITY_STYLES[value]
      )}
    >
      {CRITICALITY_TEXT[value]}
    </span>
  );
}

const INFO_SUFFICIENCY_TEXT: Record<InfoSufficiency, string> = {
  SUFICIENTE: "Informação suficiente",
  INSUFICIENTE: "Informação insuficiente",
};

export function InfoSufficiencyBadge({
  value,
}: {
  value: InfoSufficiency | null | undefined;
}) {
  if (!value) return <span className="text-xs text-mineral-500">—</span>;
  const style =
    value === "INSUFICIENTE"
      ? "bg-state-warn-soft text-state-warn ring-1 ring-inset ring-state-warn-line"
      : "bg-mineral-100 text-mineral-600 ring-1 ring-inset ring-mineral-200";
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", style)}>
      {INFO_SUFFICIENCY_TEXT[value]}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  info,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warning" | "critical";
  /** Explicação escondida atrás do ícone "i". */
  info?: ReactNode;
}) {
  const toneColor = {
    default: "text-mineral-900",
    good: "text-state-ok",
    warning: "text-state-warn",
    critical: "text-state-bad",
  }[tone];

  return (
    <Card className="px-5 py-4">
      <p className="flex items-center gap-1 text-xs font-medium text-mineral-500">
        {label}
        {info}
      </p>
      <p
        className={clsx("mt-1 font-display font-semibold tabular-nums leading-none", toneColor)}
        style={{ fontSize: "2.25rem" }}
      >
        {value}
      </p>
      {hint && <p className="mt-2 truncate text-xs text-mineral-500">{hint}</p>}
    </Card>
  );
}

/** Selo "IA" para classificações sugeridas e ainda não validadas por uma pessoa. */
export function AiPendingTag() {
  return (
    <span
      className="inline-flex items-center rounded-full border border-dashed border-brand-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600"
      title="Sugestão da IA — ainda não validada por um revisor"
    >
      IA
    </span>
  );
}
