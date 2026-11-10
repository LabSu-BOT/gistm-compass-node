import { CLASSIFICATION_RULES, CRITICALITY_RULES } from "@/lib/assessment-rubric";

// Critérios exibidos no ícone "i" (item 15). Classificação e criticidade vêm
// da mesma régua usada pela IA (`assessment-rubric.ts`), para a IA e o
// revisor decidirem pela mesma régua. VALIDAR com a equipe técnica.

export const CRITICALITY_CRITERIA: { level: string; tone: "bad" | "warn" | "ok" | "none"; text: string }[] = [
  {
    level: "Alta",
    tone: "bad",
    text: CRITICALITY_RULES.ALTA,
  },
  {
    level: "Média",
    tone: "warn",
    text: CRITICALITY_RULES.MEDIA,
  },
  {
    level: "Baixa",
    tone: "ok",
    text: CRITICALITY_RULES.BAIXA,
  },
  {
    level: "Sem gap",
    tone: "none",
    text: "Requisito atendido totalmente ou não aplicável à estrutura.",
  },
];

export const ROBUSTNESS_CRITERIA: { level: string; text: string }[] = [
  { level: "Robusta", text: "Evidência documental clara, atual e específica para a estrutura." },
  { level: "Parcial", text: "Evidência existe, mas cobre só parte do requisito ou está desatualizada." },
  { level: "Fraca", text: "Menção indireta ou genérica, sem comprovação suficiente." },
  { level: "Ausente", text: "Nenhuma evidência encontrada na documentação." },
];

export const CLASSIFICATION_CRITERIA: { level: string; text: string }[] = [
  { level: "Atende totalmente", text: CLASSIFICATION_RULES.ATENDE_TOTALMENTE },
  { level: "Atende parcialmente", text: CLASSIFICATION_RULES.ATENDE_PARCIALMENTE },
  { level: "Não atende", text: CLASSIFICATION_RULES.NAO_ATENDE },
  {
    level: "Não se aplica",
    text: "O requisito não vale para esta estrutura: recuperação pós-falha sem falha ocorrida, povos indígenas não identificados, ou requisito de estrutura existente numa estrutura nova.",
  },
];
