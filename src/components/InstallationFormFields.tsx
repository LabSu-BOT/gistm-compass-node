import type { Installation } from "@prisma/client";
import { PHASE_LABELS } from "@/lib/applicability";
import { InfoTip } from "@/components/InfoTip";

/**
 * Campos do cadastro da estrutura (itens 10, 11 e 12), em três etapas
 * numeradas. Usado na criação (lista de estruturas) e na edição
 * (aba "Dados da estrutura").
 */
export function InstallationFormFields({ installation }: { installation?: Installation | null }) {
  const v = installation;
  return (
    <div className="space-y-6">
      <Step n={1} title="Estrutura">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome da estrutura">
            <input name="name" required defaultValue={v?.name ?? ""} className="input" placeholder="Ex.: Barragem Norte" />
          </Field>
          <Field label="Local">
            <input name="location" defaultValue={v?.location ?? ""} className="input" placeholder="Ex.: Ouro Preto/MG" />
          </Field>
        </div>
      </Step>

      <Step n={2} title="Situação e classificação">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field
            label="Fase da estrutura"
            info={
              <InfoTip label="Por que a fase importa">
                Estruturas novas ou em construção recebem &quot;Não se aplica&quot; automático nos
                requisitos que valem só para estruturas existentes. A marcação entra como
                sugestão e ainda precisa de validação.
              </InfoTip>
            }
          >
            <select name="phase" defaultValue={v?.phase ?? "OPERACAO"} className="input">
              {Object.entries(PHASE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Já tem classificação de DPA?">
            <select
              name="hasDpaClassification"
              defaultValue={v?.hasDpaClassification === true ? "SIM" : v?.hasDpaClassification === false ? "NAO" : ""}
              className="input"
            >
              <option value="">Não informado</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </Field>
          <Field label="Classe de DPA">
            <select name="dpaClassification" defaultValue={v?.dpaClassification ?? ""} className="input">
              <option value="">—</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Médio</option>
              <option value="BAIXO">Baixo</option>
            </select>
          </Field>
        </div>
      </Step>

      <Step n={3} title="Responsáveis">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Engenheiro de Registro (EoR)">
            <input name="eorName" defaultValue={v?.eorName ?? ""} className="input" placeholder="Nome" />
          </Field>
          <Field label="Empresa do EoR">
            <input name="eorCompany" defaultValue={v?.eorCompany ?? ""} className="input" />
          </Field>
          <Field label="E-mail do EoR">
            <input type="email" name="eorEmail" defaultValue={v?.eorEmail ?? ""} className="input" />
          </Field>
          <Field label="Engenheiro Responsável (RTFE)">
            <input name="rtfeName" defaultValue={v?.rtfeName ?? ""} className="input" />
          </Field>
          <Field label="Executivo Responsável">
            <input name="accountableExecutive" defaultValue={v?.accountableExecutive ?? ""} className="input" />
          </Field>
          <Field label="Demais pessoas (uma por linha)" className="sm:col-span-3">
            <textarea
              name="otherResponsibles"
              rows={3}
              defaultValue={v?.otherResponsibles ?? ""}
              className="input"
              placeholder={"Ex.: Maria Silva — Geotecnia\nJoão Souza — Meio ambiente"}
            />
          </Field>
        </div>
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-mineral-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
          {n}
        </span>
        {title}
      </p>
      {children}
    </section>
  );
}

function Field({
  label,
  info,
  children,
  className,
}: {
  label: string;
  info?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  // <div> e não <label>: o InfoTip é interativo e não pode ficar dentro de um <label>.
  return (
    <div className={className}>
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-mineral-600">
        {label}
        {info}
      </span>
      {children}
    </div>
  );
}
