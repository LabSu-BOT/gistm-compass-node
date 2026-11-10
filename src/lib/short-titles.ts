// Títulos curtos dos 77 requisitos do GISTM (menos texto na tela).
// Resumos editoriais do texto oficial, A VALIDAR pela equipe técnica.
// O texto oficial completo continua no detalhe de cada requisito.

const TITLES: Record<string, [pt: string, en: string]> = {
  "1.1": ["Direitos humanos (UNGP)", "Human rights (UNGP)"],
  "1.2": ["Consentimento de povos indígenas", "Indigenous peoples' consent"],
  "1.3": ["Engajamento das pessoas afetadas", "Engagement of affected people"],
  "1.4": ["Mecanismo de queixas", "Grievance mechanism"],
  "2.1": ["Contexto social, ambiental e econômico", "Social, environmental and economic context"],
  "2.2": ["Caracterização do local", "Site characterisation"],
  "2.3": ["Análise de ruptura (dam break)", "Breach analysis"],
  "2.4": ["Exposição e vulnerabilidade humana", "Human exposure and vulnerability"],
  "3.1": ["Mudanças climáticas", "Climate change"],
  "3.2": ["Alternativas para novas estruturas", "Alternatives analysis (new facilities)"],
  "3.3": ["Revisão de tecnologias (existentes)", "Technology review (existing facilities)"],
  "3.4": ["Impactos de novas estruturas", "Impacts of new facilities"],
  "4.1": ["Classificação de consequência", "Consequence classification"],
  "4.2": ["Projeto para classificação Extrema", "Design for Extreme classification"],
  "4.3": ["Decisão sobre critérios de projeto", "Decision on design criteria"],
  "4.4": ["Critérios para modos de ruptura", "Criteria for failure modes"],
  "4.5": ["Fatores de segurança", "Factors of safety"],
  "4.6": ["Ruptura frágil", "Brittle failure"],
  "4.7": ["Princípio 4 em estruturas existentes", "Principle 4 for existing facilities"],
  "4.8": ["Relatório de Base do Projeto", "Design Basis Report"],
  "5.1": ["Alternativa escolhida no projeto", "Selected alternative in design"],
  "5.2": ["Ampliações de existentes", "Raises of existing facilities"],
  "5.3": ["Projeto robusto", "Robust design"],
  "5.4": ["Balanço hídrico", "Water balance"],
  "5.5": ["Riscos de todos os modos de ruptura", "Risk of all failure modes"],
  "5.6": ["Projeto por etapa de construção", "Design for each construction stage"],
  "5.7": ["Confirmação do Executivo (novas)", "Executive confirmation (new)"],
  "5.8": ["Confirmação do Executivo (existentes)", "Executive confirmation (existing)"],
  "6.1": ["Construir e operar conforme projeto", "Build and operate to design"],
  "6.2": ["Controle e garantia de qualidade", "Quality control and assurance"],
  "6.3": ["Relatório como construído", "As-built report"],
  "6.4": ["Manual de OMV", "OMS Manual"],
  "6.5": ["Gestão de mudanças", "Change management"],
  "6.6": ["Novas tecnologias", "New technologies"],
  "7.1": ["Programa de monitoramento", "Monitoring programme"],
  "7.2": ["Monitoramento de engenharia", "Engineering monitoring"],
  "7.3": ["Indicadores de desempenho", "Performance indicators"],
  "7.4": ["Análise dos dados", "Data analysis"],
  "7.5": ["Relatórios de monitoramento", "Monitoring reports"],
  "8.1": ["Política do Conselho", "Board policy"],
  "8.2": ["Governança e SGDR", "Governance and TMS"],
  "8.3": ["Incentivos ligados à segurança", "Safety-linked incentives"],
  "8.4": ["Executivo Responsável", "Accountable Executive"],
  "8.5": ["Engenheiro Responsável (RTER)", "Responsible Tailings Engineer (RTFE)"],
  "8.6": ["Qualificação das funções críticas", "Qualification of critical roles"],
  "8.7": ["Empresa de engenharia do EdR", "EoR engineering firm"],
  "9.1": ["Contrato do EdR", "EoR contract"],
  "9.2": ["Gestão da qualidade da engenharia", "Engineering quality management"],
  "9.3": ["Escolha do EdR", "EoR selection"],
  "9.4": ["Troca de EdR", "EoR replacement"],
  "9.5": ["Conselho Independente (CIRR)", "Independent review board (ITRB)"],
  "10.1": ["Avaliação de riscos", "Risk assessment"],
  "10.2": ["Revisão do SGDR", "TMS review"],
  "10.3": ["Auditorias internas", "Internal audits"],
  "10.4": ["Revisão anual do EdR", "Annual EoR review"],
  "10.5": ["Revisão periódica de segurança (RPSB)", "Dam safety review (DSR)"],
  "10.6": ["Revisões do CIRR", "ITRB reviews"],
  "10.7": ["Custos de fechamento", "Closure costs"],
  "11.1": ["Treinamento das equipes", "Workforce training"],
  "11.2": ["Experiência dos trabalhadores", "Worker experience"],
  "11.3": ["Colaboração entre áreas", "Cross-functional collaboration"],
  "11.4": ["Lições aprendidas", "Lessons learned"],
  "11.5": ["Reconhecer quem reporta", "Recognise those who report"],
  "12.1": ["Canal de denúncias", "Reporting channel"],
  "12.2": ["Proteção ao denunciante", "Whistleblower protection"],
  "13.1": ["Plano de emergência (PPRE)", "Emergency plan (EPRP)"],
  "13.2": ["Capacidade de resposta pública", "Public response capacity"],
  "13.3": ["Prontidão compartilhada", "Shared readiness"],
  "13.4": ["Resposta imediata a falha", "Immediate failure response"],
  "14.1": ["Planejamento de recuperação", "Recovery planning"],
  "14.2": ["Impactos após falha", "Post-failure impacts"],
  "14.3": ["Reconstrução e recuperação", "Reconstruction and recovery"],
  "14.4": ["Participação dos afetados", "Participation of affected people"],
  "14.5": ["Monitoramento pós-falha", "Post-failure monitoring"],
  "15.1": ["Divulgação pública", "Public disclosure"],
  "15.2": ["Respostas às partes interessadas", "Responses to stakeholders"],
  "15.3": ["Transparência global", "Global transparency"],
};

/** Título curto do requisito; cai no título longo se o código não estiver na lista. */
export function shortTitle(code: string, fallback: string, lang: "pt" | "en" = "pt"): string {
  const t = TITLES[code];
  if (!t) return fallback;
  return lang === "en" ? t[1] : t[0];
}

// Nomes curtos dos 15 princípios (o nome oficial fica no `title`, ao passar o mouse).
const PRINCIPLES: Record<number, [pt: string, en: string]> = {
  1: ["Direitos das pessoas afetadas", "Rights of affected people"],
  2: ["Base de conhecimentos", "Knowledge base"],
  3: ["Uso do conhecimento nas decisões", "Using knowledge in decisions"],
  4: ["Critérios de projeto", "Design criteria"],
  5: ["Projeto robusto", "Robust design"],
  6: ["Construção e operação", "Construction and operation"],
  7: ["Monitoramento", "Monitoring"],
  8: ["Governança e responsabilidades", "Governance and accountability"],
  9: ["Engenheiro de Registro", "Engineer of Record"],
  10: ["Revisões e garantia", "Reviews and assurance"],
  11: ["Cultura organizacional", "Organisational culture"],
  12: ["Canal de denúncias", "Reporting concerns"],
  13: ["Preparação para emergências", "Emergency preparedness"],
  14: ["Recuperação após falha", "Post-failure recovery"],
  15: ["Divulgação pública", "Public disclosure"],
};

export function shortPrinciple(n: number, fallback: string, lang: "pt" | "en" = "pt"): string {
  const t = PRINCIPLES[n];
  if (!t) return fallback;
  return lang === "en" ? t[1] : t[0];
}
