export default function Loading() {
  return (
    <div className="content-shell w-full animate-pulse py-8" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-56 rounded-lg bg-mineral-200/70" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-white shadow-[var(--shadow-card)]" />
        ))}
      </div>
    </div>
  );
}
