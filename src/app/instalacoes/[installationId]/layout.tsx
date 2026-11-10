import type { Metadata } from "next";
import { getInstallationContext } from "@/lib/context";
import { TopNav } from "@/components/TopNav";
import { AssistantFab } from "@/components/AssistantFab";
import { auth } from "@/auth";
import { withOrgContext } from "@/lib/tenant-db";
import { resolveLang } from "@/lib/lang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ installationId: string }>;
}): Promise<Metadata> {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);
  return {
    title: `${installation.name} — GISTM Compass`,
  };
}

export default async function InstallationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ installationId: string }>;
}) {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);
  const session = await auth();
  const lang = await resolveLang();

  // Alimenta o seletor de estrutura do menu. Escopado à organização da
  // sessão — o mesmo limite que `getInstallationContext` já aplica.
  const installations = await withOrgContext(session!.user.organizationId, async (tx) =>
    tx.installation.findMany({
      where: { organizationId: session!.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TopNav
        installationId={installation.id}
        installationName={installation.name}
        userName={session!.user.name ?? session!.user.email ?? ""}
        installations={installations}
        lang={lang}
      />
      <main className="min-w-0 flex-1">{children}</main>
      <AssistantFab installationId={installation.id} />
    </div>
  );
}
