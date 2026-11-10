import Link from "next/link";
import clsx from "clsx";
import { X } from "lucide-react";

/**
 * Filtros em "chips" que se acumulam (itens 14, 17, 24 e 27).
 *
 * Cada grupo é um parâmetro da URL que aceita vários valores
 * (ex.: ?p=1&p=4&crit=ALTA). Clicar num chip liga/desliga só aquele valor e
 * preserva todos os outros filtros, então as combinações são cumulativas.
 * Tudo é link comum, funciona sem JavaScript e pode ser compartilhado.
 */

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function paramValues(params: SearchParamsRecord, key: string): string[] {
  const v = params[key];
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).filter((x) => x !== "");
}

function toQuery(params: SearchParamsRecord): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      if (item !== "") qs.append(k, item);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "?";
}

export function hrefToggling(params: SearchParamsRecord, key: string, value: string): string {
  const current = paramValues(params, key);
  const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
  return toQuery({ ...params, [key]: next });
}

export function hrefWithout(params: SearchParamsRecord, keys: string[]): string {
  const copy: SearchParamsRecord = { ...params };
  for (const k of keys) delete copy[k];
  return toQuery(copy);
}

export interface ChipOption {
  value: string;
  label: string;
  /** Cor do ponto à esquerda (classe Tailwind de fundo). */
  dot?: string;
  count?: number;
  title?: string;
}

export function FilterGroup({
  label,
  paramKey,
  options,
  params,
  info,
}: {
  label: string;
  paramKey: string;
  options: ChipOption[];
  params: SearchParamsRecord;
  info?: React.ReactNode;
}) {
  const selected = paramValues(params, paramKey);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 flex items-center gap-1 text-xs font-medium text-mineral-500">
        {label}
        {info}
      </span>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <Link
            key={o.value}
            href={hrefToggling(params, paramKey, o.value)}
            scroll={false}
            title={o.title}
            aria-pressed={on}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-mineral-200 bg-white text-mineral-700 hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            {o.dot && <span className={clsx("h-2 w-2 rounded-full", o.dot, on && "ring-1 ring-white")} />}
            {o.label}
            {o.count !== undefined && (
              <span className={clsx("tabular-nums", on ? "text-white/80" : "text-mineral-400")}>{o.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function ClearFilters({
  params,
  keys,
}: {
  params: SearchParamsRecord;
  keys: string[];
}) {
  const active = keys.some((k) => paramValues(params, k).length > 0);
  if (!active) return null;
  return (
    <Link
      href={hrefWithout(params, keys)}
      scroll={false}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-mineral-500 hover:bg-mineral-100 hover:text-mineral-800"
    >
      <X size={12} />
      Limpar filtros
    </Link>
  );
}
