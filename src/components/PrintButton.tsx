"use client";

import { useEffect } from "react";
import { FileDown } from "lucide-react";

/**
 * Botão de gerar o PDF do relatório (item 26). Usa a impressão do navegador
 * ("Salvar como PDF"), que preserva o layout da página. Com `autoPrint`, a
 * janela abre sozinha, usado pelo atalho "Gerar PDF" do Sumário executivo.
 */
export function PrintButton({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    // Espera as fontes e os gráficos renderizarem antes de abrir a impressão.
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-brand-700 print:hidden"
    >
      <FileDown size={18} />
      Baixar PDF
    </button>
  );
}
