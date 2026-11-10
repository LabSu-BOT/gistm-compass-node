"use client";

import clsx from "clsx";

const LANG_COOKIE = "gistm_lang";

/**
 * Alternância PT/EN do conteúdo oficial do GISTM. Grava a escolha num cookie
 * (lido por `resolveLang` no servidor) e recarrega a página atual sem o
 * parâmetro `lang` da URL, para que a escolha valha em todas as abas.
 *
 * `extraParams` é mantido por compatibilidade com as chamadas antigas, mas não
 * é mais necessário: os demais parâmetros da URL são preservados.
 */
export function LangSwitcher({
  lang,
}: {
  lang: "pt" | "en";
  extraParams?: Record<string, string | undefined>;
}) {
  function choose(target: "pt" | "en") {
    if (target === lang) return;
    document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    const url = new URL(window.location.href);
    url.searchParams.delete("lang");
    window.location.assign(url.toString());
  }

  return (
    <div className="flex rounded-full border border-mineral-200 bg-white p-0.5 text-xs" role="group" aria-label="Idioma do conteúdo GISTM">
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={lang === l}
          className={clsx(
            "rounded-full px-2.5 py-1 font-medium uppercase transition-colors",
            lang === l ? "bg-brand-500 text-white" : "text-mineral-600 hover:text-mineral-900"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
