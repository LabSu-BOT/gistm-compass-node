import Link from "next/link";
import { redirect } from "next/navigation";
import { computeInstallationStats } from "@/lib/installation-stats";
import { createInstallation, deleteInstallation } from "./actions";
import { Card, EmptyState } from "@/components/ui";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { CompassMark } from "@/components/CompassMark";
import { InstallationFormFields } from "@/components/InstallationFormFields";
import { SubmitButton } from "@/components/SubmitButton";
import { Plus, Trash2, BarChart3, LogOut, Users, ArrowRight, Search } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth-actions";
import { withOrgContext } from "@/lib/tenant-db";
import { PHASE_LABELS } from "@/lib/applicability";

export const dynamic = "force-dynamic";

export default async function InstalacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nova?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q = "", nova } = await searchParams;

  const installations = await withOrgContext(session.user.organizationId, async (tx) =>
    tx.installation.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: { name: "asc" },
    })
  );

  const rows = await Promise.all(
    installations.map(async (installation) => ({
      installation,
      stats: await computeInstallationStats(installation.id),
    }))
  );

  const abrirCadastro = nova === "1" || (rows.length === 0 && !q);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="bg-brand-800 text-mineral-100 print:hidden">
        <div className="content-shell flex h-14 items-center gap-4">
          <div className="flex items-center gap-2">
            <CompassMark className="text-brand-300" size={24} />
            <span className="font-display text-[1rem] font-semibold tracking-tight">GISTM Compass</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {rows.length >= 2 && (
              <Link href="/instalacoes/comparar" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-mineral-300 hover:bg-brand-700 hover:text-white">
                <BarChart3 size={14} />
                Comparar
              </Link>
            )}
            {session.user.role === "ADMIN" && (
              <Link href="/organizacao/usuarios" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-mineral-300 hover:bg-brand-700 hover:text-white">
                <Users size={14} />
                Usuários
              </Link>
            )}
            <Link href="/conta" className="max-w-[10rem] truncate rounded-md px-2.5 py-1.5 text-xs text-mineral-300 hover:bg-brand-700 hover:text-white">
              {session.user.name}
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-mineral-400 hover:bg-brand-700 hover:text-white" title="Sair">
                <LogOut size={13} />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="content-shell py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-mineral-900" style={{ fontSize: "1.75rem" }}>
              Suas estruturas
            </h1>
            <p className="mt-1 text-sm text-mineral-500">{installations.length} estrutura(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <form method="get" className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mineral-400" />
              <input type="text" name="q" defaultValue={q} placeholder="Buscar" className="input w-48 rounded-full pl-9" />
            </form>
            <Link href="/instalacoes?nova=1" scroll={false} className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              <Plus size={16} />
              Cadastrar estrutura
            </Link>
          </div>
        </div>

        {abrirCadastro && (
          <Card className="mb-8 px-6 py-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-mineral-900" style={{ fontSize: "var(--text-title)" }}>
                Nova estrutura
              </h2>
              {rows.length > 0 && (
                <Link href="/instalacoes" className="text-xs font-medium text-mineral-500 hover:text-mineral-800">
                  Cancelar
                </Link>
              )}
            </div>
            <form action={createInstallation} className="space-y-6">
              <InstallationFormFields />
              <div className="border-t border-mineral-100 pt-4">
                <SubmitButton pendingLabel="Cadastrando…" className="btn-primary">
                  <Plus size={15} />
                  Cadastrar estrutura
                </SubmitButton>
              </div>
            </form>
          </Card>
        )}

        {rows.length === 0 ? (
          q ? (
            <Card>
              <EmptyState>Nenhuma estrutura encontrada para essa busca.</EmptyState>
            </Card>
          ) : null
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ installation, stats }) => (
              <Card key={installation.id} className="flex flex-col px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/instalacoes/${installation.id}/dashboard`}
                      className="block truncate text-base font-semibold text-mineral-900 hover:text-brand-700"
                    >
                      {installation.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-mineral-500">
                      {PHASE_LABELS[installation.phase]}
                      {installation.location && ` · ${installation.location}`}
                      {stats.cycleName && ` · ${stats.cycleName}`}
                    </p>
                  </div>
                  <ReadinessGauge score={stats.readinessScore} size={56} showLabel={false} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Atendimento" value={stats.compliancePct !== null ? `${stats.compliancePct}%` : "—"} />
                  <Metric label="Gaps altos" value={String(stats.criticalGaps)} alert={stats.criticalGaps > 0} />
                  <Metric label="Ações vencidas" value={String(stats.overdueActions)} alert={stats.overdueActions > 0} />
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-mineral-100 pt-3">
                  <span className="text-xs text-mineral-500">
                    {stats.validatedCount}/{stats.totalRequirements} validados
                  </span>
                  <div className="flex items-center gap-1">
                    {session.user.role === "ADMIN" && (
                      <form action={deleteInstallation.bind(null, installation.id)}>
                        <button
                          type="submit"
                          className="rounded-full p-1.5 text-mineral-300 hover:bg-state-bad-soft hover:text-state-bad"
                          title="Remover estrutura"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/instalacoes/${installation.id}/dashboard`}
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      Abrir
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-mineral-50 px-2 py-2.5">
      <dd className={`font-display text-xl font-semibold tabular-nums ${alert ? "text-state-bad" : "text-mineral-900"}`}>
        {value}
      </dd>
      <dt className="mt-0.5 text-[11px] text-mineral-500">{label}</dt>
    </div>
  );
}
