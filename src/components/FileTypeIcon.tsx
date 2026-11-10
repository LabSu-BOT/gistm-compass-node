import clsx from "clsx";

/** Ícone do tipo de arquivo (item 23): folha com a extensão e cor por família. */
const FAMILY: Record<string, { label: string; color: string }> = {
  pdf: { label: "PDF", color: "bg-[#b42318]" },
  doc: { label: "DOC", color: "bg-[#1d5bbf]" },
  docx: { label: "DOC", color: "bg-[#1d5bbf]" },
  xls: { label: "XLS", color: "bg-[#1f7a3f]" },
  xlsx: { label: "XLS", color: "bg-[#1f7a3f]" },
  csv: { label: "CSV", color: "bg-[#1f7a3f]" },
  ppt: { label: "PPT", color: "bg-[#c2510f]" },
  pptx: { label: "PPT", color: "bg-[#c2510f]" },
  txt: { label: "TXT", color: "bg-mineral-500" },
  md: { label: "MD", color: "bg-mineral-500" },
  png: { label: "IMG", color: "bg-[#7a3fb0]" },
  jpg: { label: "IMG", color: "bg-[#7a3fb0]" },
  jpeg: { label: "IMG", color: "bg-[#7a3fb0]" },
  gif: { label: "IMG", color: "bg-[#7a3fb0]" },
  webp: { label: "IMG", color: "bg-[#7a3fb0]" },
};

export function fileExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

export function FileTypeIcon({ fileName, size = 36 }: { fileName: string; size?: number }) {
  const ext = fileExtension(fileName);
  const fam = FAMILY[ext] ?? { label: (ext || "?").slice(0, 4).toUpperCase(), color: "bg-mineral-400" };
  return (
    <span
      className="relative inline-flex shrink-0 items-end justify-center rounded-md border border-mineral-200 bg-white"
      style={{ width: size * 0.8, height: size }}
      aria-label={`Arquivo ${fam.label}`}
    >
      {/* dobra do canto */}
      <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-bl-sm border-b border-l border-mineral-200 bg-mineral-100" />
      <span
        className={clsx("mb-1.5 rounded px-1 font-mono text-[9px] font-semibold leading-tight text-white", fam.color)}
      >
        {fam.label}
      </span>
    </span>
  );
}
