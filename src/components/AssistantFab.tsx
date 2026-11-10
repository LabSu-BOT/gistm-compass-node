"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Bot, X } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";

/**
 * Assistente como botão flutuante no canto inferior direito, presente em
 * todas as abas da estrutura (item 6). Abre um painel lateral sem sair da
 * tela atual. A conversa é mantida enquanto o usuário navega entre as abas,
 * porque este componente fica no layout da estrutura.
 */
export function AssistantFab({ installationId }: { installationId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="print:hidden">
      {/* Painel: fica montado (só escondido) para não perder a conversa. */}
      <div
        className={clsx(
          "fixed inset-0 z-50 bg-mineral-900/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={clsx(
          "fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-[var(--shadow-float)] transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Assistente"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-mineral-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Bot size={16} />
            </span>
            <p className="font-semibold text-mineral-900">Assistente</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-mineral-500 hover:bg-mineral-100 hover:text-mineral-900"
            aria-label="Fechar assistente"
          >
            <X size={18} />
          </button>
        </div>
        <ChatPanel installationId={installationId} className="flex min-h-0 flex-1 flex-col" />
      </aside>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 hover:bg-brand-700"
          aria-label="Abrir assistente"
          title="Assistente"
        >
          <Bot size={24} />
        </button>
      )}
    </div>
  );
}
