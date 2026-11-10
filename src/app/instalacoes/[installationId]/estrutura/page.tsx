import { getInstallationContext } from "@/lib/context";
import { PageHeader, PageBody, Card } from "@/components/ui";
import { InstallationFormFields } from "@/components/InstallationFormFields";
import { SubmitButton } from "@/components/SubmitButton";
import { updateInstallation } from "@/app/instalacoes/actions";

export const dynamic = "force-dynamic";

export default async function EstruturaPage({
  params,
}: {
  params: Promise<{ installationId: string }>;
}) {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);

  return (
    <div>
      <PageHeader title="Dados da estrutura" />
      <PageBody>
        <Card className="max-w-4xl px-6 py-6">
          <form action={updateInstallation.bind(null, installation.id)} className="space-y-6">
            <InstallationFormFields installation={installation} />
            <div className="border-t border-mineral-100 pt-4">
              <SubmitButton pendingLabel="Salvando…" className="btn-primary">
                Salvar dados
              </SubmitButton>
            </div>
          </form>
        </Card>
      </PageBody>
    </div>
  );
}
