import clsx from "clsx";
import { Check, X, Minus } from "lucide-react";
import type { FinalClassification, GapCriticality } from "@prisma/client";

/**
 * Status em ícones, sem palavras (menos texto na tela). A palavra continua no
 * `title` (passar o mouse) e no leitor de tela.
 *
 * - Ícone cheio  = decisão validada por uma pessoa.
 * - Ícone vazado (contorno tracejado) = sugestão da IA ainda não validada.
 */

export const CLASSIFICATION_LABEL: Record<FinalClassification | "NAO_AVALIADO", string> = {
  ATENDE_TOTALMENTE: "Atende",
  ATENDE_PARCIALMENTE: "Atende parcialmente",
  NAO_ATENDE: "Não atende",
  NAO_SE_APLICA: "Não se aplica",
  NAO_AVALIADO: "Sem análise",
};

const FILLED: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "bg-state-ok text-white",
  ATENDE_PARCIALMENTE: "bg-[#c2870f] text-white",
  NAO_ATENDE: "bg-state-bad text-white",
  NAO_SE_APLICA: "bg-mineral-300 text-white",
};

const OUTLINE: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE: "border-2 border-dashed border-state-ok text-state-ok",
  ATENDE_PARCIALMENTE: "border-2 border-dashed border-[#c2870f] text-[#c2870f]",
  NAO_ATENDE: "border-2 border-dashed border-state-bad text-state-bad",
  NAO_SE_APLICA: "border-2 border-dashed border-mineral-300 text-mineral-400",
};

function Glyph({ value, size }: { value: FinalClassification; size: number }) {
  const s = Math.round(size * 0.58);
  if (value === "ATENDE_TOTALMENTE") return <Check size={s} strokeWidth={3} />;
  if (value === "NAO_ATENDE") return <X size={s} strokeWidth={3} />;
  if (value === "NAO_SE_APLICA") return <Minus size={s} strokeWidth={3} />;
  // Parcial: meio círculo preenchido.
  const d = Math.round(size * 0.5);
  return (
    <span
      className="block rounded-full border-2 border-current"
      style={{ width: d, height: d, background: "linear-gradient(90deg, currentColor 50%, transparent 50%)" }}
    />
  );
}

export function ClassificationIcon({
  value,
  validated = true,
  size = 24,
}: {
  value: FinalClassification | null | undefined;
  validated?: boolean;
  size?: number;
}) {
  const label = value
    ? `${CLASSIFICATION_LABEL[value]}${validated ? "" : " — sugestão da IA"}`
    : CLASSIFICATION_LABEL.NAO_AVALIADO;
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        !value
          ? "border-2 border-dashed border-mineral-200"
          : validated
          ? FILLED[value]
          : clsx(OUTLINE[value], "bg-white")
      )}
      style={{ width: size, height: size }}
    >
      {value && <Glyph value={validated ? value : value} size={size} />}
    </span>
  );
}

const CRIT_LEVEL: Record<GapCriticality, number> = { ALTA: 3, MEDIA: 2, BAIXA: 1, NAO_SE_APLICA: 0 };
const CRIT_COLOR: Record<GapCriticality, string> = {
  ALTA: "bg-state-bad",
  MEDIA: "bg-[#c2870f]",
  BAIXA: "bg-state-ok",
  NAO_SE_APLICA: "bg-mineral-200",
};
export const CRITICALITY_LABEL: Record<GapCriticality, string> = {
  ALTA: "Criticidade alta",
  MEDIA: "Criticidade média",
  BAIXA: "Criticidade baixa",
  NAO_SE_APLICA: "Sem gap",
};

/** Criticidade como barrinhas de sinal: 3 = alta, 2 = média, 1 = baixa. */
export function CriticalityBars({ value }: { value: GapCriticality | null | undefined }) {
  if (!value || value === "NAO_SE_APLICA") return <span className="inline-block w-[18px]" aria-hidden />;
  const level = CRIT_LEVEL[value];
  return (
    <span
      role="img"
      aria-label={CRITICALITY_LABEL[value]}
      title={CRITICALITY_LABEL[value]}
      className="inline-flex h-4 w-[18px] shrink-0 items-end gap-[2px]"
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={clsx("w-1 rounded-sm", i <= level ? CRIT_COLOR[value] : "bg-mineral-200")}
          style={{ height: `${33 * i}%` }}
        />
      ))}
    </span>
  );
}

/** Legenda única dos ícones, aparece uma vez por tela. */
export function StatusLegend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mineral-500">
      <span className={item}><ClassificationIcon value="ATENDE_TOTALMENTE" size={16} /> Atende</span>
      <span className={item}><ClassificationIcon value="ATENDE_PARCIALMENTE" size={16} /> Parcial</span>
      <span className={item}><ClassificationIcon value="NAO_ATENDE" size={16} /> Não atende</span>
      <span className={item}><ClassificationIcon value="NAO_SE_APLICA" size={16} /> Não se aplica</span>
      <span className="h-3 w-px bg-mineral-200" />
      <span className={item}><ClassificationIcon value="ATENDE_TOTALMENTE" validated={false} size={16} /> Sugestão da IA (não validada)</span>
      <span className="h-3 w-px bg-mineral-200" />
      <span className={item}><CriticalityBars value="ALTA" /> Criticidade</span>
    </div>
  );
}
