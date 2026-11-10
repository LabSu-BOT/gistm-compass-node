import type { FinalClassification } from "@prisma/client";

// Régua de avaliação usada pela IA, pela heurística e pelo ícone "i".
// "Atende" só com evidência formal, da estrutura e em vigor.

export const CLASSIFICATION_RULES: Record<FinalClassification, string> = {
  ATENDE_TOTALMENTE:
    "Todos os critérios do requisito estão cobertos por evidência documental específica da estrutura, " +
    "em vigor (revisão emitida, aprovada ou assinada) e com registro de que é aplicada na prática.",
  ATENDE_PARCIALMENTE:
    "Existe evidência relacionada, mas ela não fecha o requisito: cobre só parte dos critérios; é " +
    "corporativa/do grupo sem desdobramento para a estrutura; está em rascunho ou sem aprovação; está " +
    "desatualizada; define o papel ou o processo sem nomeação ou registro de execução; ou um revisor " +
    "técnico (ex.: o Engenheiro de Registro) apontou correções ainda abertas.",
  NAO_ATENDE:
    "Depois de procurar de verdade, não há evidência para nenhum critério do requisito, ou os " +
    "documentos registram explicitamente que o item não existe (ex.: \"ainda não foi nomeado\", " +
    "\"recomenda-se criar\").",
  NAO_SE_APLICA:
    "O requisito não vale para esta estrutura pelas condições do próprio texto (ver regras de " +
    "aplicabilidade).",
};

export const APPLICABILITY_RULES = [
  "Requisitos de recuperação pós-falha (14.2 a 14.5) só se aplicam depois de uma falha catastrófica; " +
    "se não houve falha, são \"Não se aplica\".",
  "Requisitos sobre povos indígenas (1.2) são \"Não se aplica\" quando os estudos da estrutura não " +
    "identificam povos indígenas ou tribais afetados.",
  "Requisitos escritos \"para estruturas novas\" também valem para alteamentos, expansões e novas " +
    "etapas em projeto ou em execução numa estrutura existente; só são \"Não se aplica\" se não houver " +
    "nova etapa prevista.",
  "Requisitos escritos \"para estruturas existentes\" não se aplicam a estrutura nova ainda não construída.",
];

export const EVIDENCE_RULES = [
  "Documento que apenas repete ou explica o texto do GISTM não é evidência de atendimento.",
  "Relatórios de revisão técnica (EoR, DSR, auditorias) valem como evidência do que existe e, quando " +
    "apontam lacunas ou recomendações abertas, indicam atendimento parcial ou não atendimento daquele ponto.",
  "Política ou compromisso do grupo corporativo, sem procedimento ou registro específico da estrutura, " +
    "é no máximo atendimento parcial.",
  "Função descrita em manual (ex.: OMS) sem carta de nomeação ou contrato é atendimento parcial.",
];

export const CRITICALITY_RULES = {
  ALTA:
    "A lacuna afeta controles de segurança física da estrutura (modos de falha, monitoramento, projeto, " +
    "construção, resposta a emergência) ou a estrutura tem classificação de consequência Muito Alta ou " +
    "Extrema e a lacuna é de governança técnica (EoR, ITRB, Executivo Responsável). Prazo sugerido: 30 dias.",
  MEDIA:
    "Lacuna de governança, documentação ou engajamento com impacto indireto na segurança. Prazo sugerido: 90 dias.",
  BAIXA: "Lacuna formal ou administrativa, sem efeito direto na segurança. Prazo sugerido: 180 dias.",
} as const;

/** Requisitos que só se aplicam depois de uma falha catastrófica. */
export const POST_FAILURE_ONLY = ["14.2", "14.3", "14.4", "14.5"];

/**
 * Consolida a avaliação item a item (a, b, c…) no resultado do requisito:
 * todos "Não se aplica" → Não se aplica; todos os aplicáveis "Atende" →
 * Atende; todos os aplicáveis "Não atende" → Não atende; qualquer mistura → Parcial.
 */
export function aggregateItems(items: FinalClassification[]): FinalClassification | null {
  if (items.length === 0) return null;
  const applicable = items.filter((c) => c !== "NAO_SE_APLICA");
  if (applicable.length === 0) return "NAO_SE_APLICA";
  if (applicable.every((c) => c === "ATENDE_TOTALMENTE")) return "ATENDE_TOTALMENTE";
  if (applicable.every((c) => c === "NAO_ATENDE")) return "NAO_ATENDE";
  return "ATENDE_PARCIALMENTE";
}

/** Texto da régua para a instrução da IA. */
export function rubricPrompt(): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return (
    `CRITÉRIOS DE ATENDIMENTO (rigor de auditoria de conformidade):\n` +
    `- ATENDE_TOTALMENTE: ${CLASSIFICATION_RULES.ATENDE_TOTALMENTE}\n` +
    `- ATENDE_PARCIALMENTE: ${CLASSIFICATION_RULES.ATENDE_PARCIALMENTE}\n` +
    `- NAO_ATENDE: ${CLASSIFICATION_RULES.NAO_ATENDE}\n` +
    `- NAO_SE_APLICA: ${CLASSIFICATION_RULES.NAO_SE_APLICA}\n\n` +
    `REGRAS DE APLICABILIDADE:\n${list(APPLICABILITY_RULES)}\n\n` +
    `COMO PESAR A EVIDÊNCIA:\n${list(EVIDENCE_RULES)}\n\n` +
    `CRITICIDADE DA LACUNA:\n` +
    `- ALTA: ${CRITICALITY_RULES.ALTA}\n` +
    `- MEDIA: ${CRITICALITY_RULES.MEDIA}\n` +
    `- BAIXA: ${CRITICALITY_RULES.BAIXA}\n` +
    `- NAO_SE_APLICA: só quando a classificação for ATENDE_TOTALMENTE ou NAO_SE_APLICA.`
  );
}
