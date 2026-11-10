import Link from "next/link";
import clsx from "clsx";
import type { FinalClassification } from "@prisma/client";
import { CLASSIFICATION_LABEL } from "@/components/StatusIcons";

/**
 * Mapa de calor: uma linha por princípio, um quadradinho por requisito.
 * Mostra a conformidade inteira em um olhar, sem frases. Cada quadradinho
 * abre o requisito; o número do princípio abre a Análise filtrada.
 */

export type HeatmapRow = {
  number: number;
  name: string;
  href: string;
  items: {
    code: string;
    title: string;
    href: string;
    cls: FinalClassification | null;
    validated: boolean;
  }[];
};

const SOLID: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "bg-state-ok text-white border-state-ok",
  ATENDE_PARCIALMENTE: "bg-[#c2870f] text-white border-[#c2870f]",
  NAO_ATENDE: "bg-state-bad text-white border-state-bad",
  NAO_SE_APLICA: "bg-mineral-300 text-white border-mineral-300",
};
const OUTLINE: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "bg-state-ok-soft text-state-ok border-state-ok border-dashed",
  ATENDE_PARCIALMENTE: "bg-state-warn-soft text-[#9a6a06] border-[#c2870f] border-dashed",
  NAO_ATENDE: "bg-state-bad-soft text-state-bad border-state-bad border-dashed",
  NAO_SE_APLICA: "bg-mineral-50 text-mineral-400 border-mineral-300 border-dashed",
};

export function RequirementHeatmap({ rows }: { rows: HeatmapRow[] }) {
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.number} className="flex items-center gap-3">
          <Link
            href={row.href}
            title={row.name}
            className="flex w-60 shrink-0 items-center gap-2 rounded-lg py-0.5 pr-2 text-xs text-mineral-600 hover:text-brand-700"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mineral-100 text-[11px] font-semibold text-mineral-700">
              {row.number}
            </span>
            <span className="truncate">{row.name}</span>
          </Link>
          <div className="flex flex-wrap gap-1.5">
            {row.items.map((it) => {
              const label = `${it.code} · ${it.title} — ${
                it.cls ? CLASSIFICATION_LABEL[it.cls] + (it.validated ? "" : " (IA)") : CLASSIFICATION_LABEL.NAO_AVALIADO
              }`;
              return (
                <Link
                  key={it.code}
                  href={it.href}
                  title={label}
                  aria-label={label}
                  className={clsx(
                    "flex h-8 w-11 items-center justify-center rounded-md border-2 font-mono text-[11px] font-semibold tabular-nums transition-transform hover:scale-110",
                    !it.cls
                      ? "border-dashed border-mineral-200 bg-white text-mineral-400"
                      : it.validated
                      ? SOLID[it.cls]
                      : OUTLINE[it.cls]
                  )}
                >
                  {it.code}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
