"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, Info, AlertTriangle, X } from "lucide-react";

interface FlashMessage {
  id: string;
  text: string;
  tone: "ok" | "info" | "warn";
}

const FLASH_COOKIE = "gistm_flash";

/** Exibe a confirmação gravada por `flash()` numa Server Action (item 7). */
export function Toaster({ flash }: { flash: FlashMessage | null }) {
  const [visible, setVisible] = useState<FlashMessage | null>(flash);

  useEffect(() => {
    if (!flash) return;
    setVisible(flash);
    // Apaga o cookie para a mensagem não reaparecer no próximo carregamento.
    document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`;
    const t = setTimeout(() => setVisible(null), 4500);
    return () => clearTimeout(t);
    // O id muda a cada nova mensagem; é ele que dispara o efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash?.id]);

  if (!visible) return null;

  const Icon = visible.tone === "ok" ? Check : visible.tone === "warn" ? AlertTriangle : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-28 z-[60] -translate-x-1/2 print:hidden"
    >
      <div
        className={clsx(
          "flex items-center gap-2.5 rounded-full border bg-white py-2 pl-3 pr-2 shadow-[var(--shadow-float)]",
          visible.tone === "ok" && "border-state-ok-line",
          visible.tone === "warn" && "border-state-warn-line",
          visible.tone === "info" && "border-brand-200"
        )}
      >
        <span
          className={clsx(
            "flex h-6 w-6 items-center justify-center rounded-full",
            visible.tone === "ok" && "bg-state-ok-soft text-state-ok",
            visible.tone === "warn" && "bg-state-warn-soft text-state-warn",
            visible.tone === "info" && "bg-brand-50 text-brand-600"
          )}
        >
          <Icon size={14} />
        </span>
        <span className="text-sm font-medium text-mineral-800">{visible.text}</span>
        <button
          type="button"
          onClick={() => setVisible(null)}
          className="rounded-full p-1 text-mineral-400 hover:bg-mineral-100 hover:text-mineral-700"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
