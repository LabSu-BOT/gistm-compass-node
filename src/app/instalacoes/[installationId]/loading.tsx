/**
 * Esqueleto exibido enquanto a aba carrega (item 3): a navegação responde na
 * hora, mesmo quando a consulta ao banco demora.
 */
export default function Loading() {
  return (
    <div className="content-shell animate-pulse py-8" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-64 rounded-lg bg-mineral-200/70" />
      <div className="mt-2 h-4 w-40 rounded bg-mineral-200/50" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white shadow-[var(--shadow-card)]" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-2xl bg-white shadow-[var(--shadow-card)]" />
    </div>
  );
}
