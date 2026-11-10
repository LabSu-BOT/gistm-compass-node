import { redirect } from "next/navigation";

// O Assistente saiu do menu e agora é um botão flutuante presente em todas as
// abas (item 6). Links antigos para esta página levam ao Sumário executivo,
// onde o botão do Assistente está disponível no canto inferior direito.
export default async function AssistentePage({
  params,
}: {
  params: Promise<{ installationId: string }>;
}) {
  const { installationId } = await params;
  redirect(`/instalacoes/${installationId}/dashboard`);
}
