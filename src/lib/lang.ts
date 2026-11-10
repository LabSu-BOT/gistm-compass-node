import { cookies } from "next/headers";

export type Lang = "pt" | "en";

export const LANG_COOKIE = "gistm_lang";

/**
 * Idioma do conteúdo oficial do GISTM (tópicos, princípios e requisitos).
 *
 * Antes o idioma vivia só na querystring (?lang=en). Qualquer link do menu
 * que não repassasse o parâmetro voltava a página para PT, o que dava a
 * impressão de que "o inglês parou de funcionar". Agora a escolha fica num
 * cookie e vale em todas as abas; a querystring continua aceita (tem
 * prioridade) para links diretos.
 */
export async function resolveLang(langParam?: string | null): Promise<Lang> {
  if (langParam === "en" || langParam === "pt") return langParam;
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "en" ? "en" : "pt";
}
