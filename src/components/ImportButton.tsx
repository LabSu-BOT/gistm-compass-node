"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud, FileText, FolderInput, ChevronDown, Loader2 } from "lucide-react";

/**
 * Botão único "Importar" (item 22). Ao clicar, o usuário escolhe entre
 * arquivo(s) avulso(s) ou uma pasta inteira; a seleção é enviada na hora,
 * sem formulário de metadados.
 */
export function ImportButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  function submitWith(input: HTMLInputElement | null) {
    if (!input || !input.files || input.files.length === 0 || !formRef.current) return;
    // Só o campo usado vai no envio: o outro fica desabilitado.
    const other = input === filesRef.current ? folderRef.current : filesRef.current;
    if (other) other.disabled = true;
    formRef.current.requestSubmit();
    setTimeout(() => {
      if (other) other.disabled = false;
    }, 0);
  }

  return (
    <div ref={wrapRef} className="relative">
      <form ref={formRef} action={action}>
        <input
          ref={filesRef}
          type="file"
          name="files"
          multiple
          className="hidden"
          onChange={() => submitWith(filesRef.current)}
        />
        <input
          ref={folderRef}
          type="file"
          name="files"
          multiple
          className="hidden"
          onChange={() => submitWith(folderRef.current)}
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        />
        <TriggerButton onClick={() => setOpen((v) => !v)} />
      </form>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-mineral-200 bg-white shadow-[var(--shadow-float)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              filesRef.current?.click();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-mineral-50"
          >
            <FileText size={18} className="text-brand-500" />
            <span>
              <span className="block text-sm font-medium text-mineral-900">Arquivo(s)</span>
              <span className="block text-xs text-mineral-500">Um ou vários arquivos</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              folderRef.current?.click();
            }}
            className="flex w-full items-center gap-3 border-t border-mineral-100 px-4 py-3 text-left hover:bg-mineral-50"
          >
            <FolderInput size={18} className="text-brand-500" />
            <span>
              <span className="block text-sm font-medium text-mineral-900">Pasta</span>
              <span className="block text-xs text-mineral-500">Todos os arquivos da pasta</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function TriggerButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-brand-700 disabled:opacity-70"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
      {pending ? "Importando…" : "Importar"}
      {!pending && <ChevronDown size={14} className="opacity-80" />}
    </button>
  );
}
