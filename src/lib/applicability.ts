import { prisma } from "@/lib/prisma";
import type { InstallationPhase } from "@prisma/client";
import { POST_FAILURE_ONLY } from "@/lib/assessment-rubric";

/**
 * "Não se aplica" automático (item 12).
 *
 * Requisitos cujo texto oficial vale só para estruturas EXISTENTES não se
 * aplicam a uma estrutura cadastrada como nova ou em construção. A lista foi
 * levantada a partir do texto de cada requisito (começam com "Para
 * instalações existentes…", "Para estruturas existentes…" etc.).
 * VALIDAR com a equipe técnica antes de publicar; para mudar, edite só esta lista.
 */
export const ONLY_EXISTING_FACILITIES = ["1.1", "3.3", "4.7", "5.2", "5.8"];

export const NEW_PHASES: InstallationPhase[] = ["NOVA", "EM_CONSTRUCAO"];

export const PHASE_LABELS: Record<InstallationPhase, string> = {
  NOVA: "Nova (em projeto)",
  EM_CONSTRUCAO: "Em construção",
  OPERACAO: "Em operação",
  INATIVA: "Inativa",
  FECHAMENTO: "Em fechamento / fechada",
};

const AUTO_NOTE =
  "Marcado automaticamente como \"Não se aplica\": o requisito vale só para estruturas existentes, " +
  "e esta estrutura está cadastrada como nova ou em construção. Confirme na validação.";

/**
 * Aplica (ou desfaz) o "Não se aplica" automático no ciclo ativo da estrutura.
 *
 * A marcação entra como SUGESTÃO (campos ai*), não como decisão final: a
 * regra da plataforma de que nada vira decisão sem validação humana continua
 * valendo. Avaliações já validadas por uma pessoa nunca são alteradas.
 */
export async function applyAutomaticNotApplicable(installationId: string, phase: InstallationPhase) {
  const cycle = await prisma.cycle.findFirst({
    where: { installationId },
    orderBy: { startedAt: "desc" },
  });
  if (!cycle) return 0;

  let changed = await applyPostFailureNotApplicable(installationId, cycle.id);

  const requirements = await prisma.requirement.findMany({
    where: { code: { in: ONLY_EXISTING_FACILITIES } },
    select: { id: true },
  });

  for (const req of requirements) {
    const existing = await prisma.assessment.findUnique({
      where: {
        requirementId_installationId_cycleId: {
          requirementId: req.id,
          installationId,
          cycleId: cycle.id,
        },
      },
    });
    if (existing?.status === "VALIDADO") continue;

    if (NEW_PHASES.includes(phase)) {
      const data = {
        aiClassification: "NAO_SE_APLICA" as const,
        aiCriticality: "NAO_SE_APLICA" as const,
        aiRobustness: null,
        aiInfoSufficiency: "SUFICIENTE" as const,
        aiJustification: AUTO_NOTE,
        aiConfidence: 1,
        status: "EM_REVISAO" as const,
      };
      const saved = existing
        ? await prisma.assessment.update({ where: { id: existing.id }, data })
        : await prisma.assessment.create({
            data: { requirementId: req.id, installationId, cycleId: cycle.id, ...data },
          });
      await prisma.auditLog.create({
        data: {
          assessmentId: saved.id,
          actor: "Regra automática",
          action: "NAO_SE_APLICA_AUTOMATICO",
          note: "Estrutura nova ou em construção.",
        },
      });
      changed++;
    } else if (existing && existing.aiJustification === AUTO_NOTE) {
      // A estrutura deixou de ser nova: remove só a marcação automática.
      await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          aiClassification: null,
          aiCriticality: null,
          aiInfoSufficiency: null,
          aiJustification: null,
          aiConfidence: null,
          status: "SUGESTAO_IA",
        },
      });
      changed++;
    }
  }
  return changed;
}

const POST_FAILURE_NOTE =
  "Marcado automaticamente como \"Não se aplica\": requisito de recuperação pós-falha, que só se " +
  "aplica depois de uma falha catastrófica. Confirme na validação.";

/**
 * Requisitos de recuperação pós-falha (14.2 a 14.5) entram como "Não se
 * aplica" sugerido em qualquer fase. Mesma regra: só sugestão, e avaliações
 * validadas não mudam.
 */
async function applyPostFailureNotApplicable(installationId: string, cycleId: string) {
  const requirements = await prisma.requirement.findMany({
    where: { code: { in: POST_FAILURE_ONLY } },
    select: { id: true },
  });
  let changed = 0;
  for (const req of requirements) {
    const existing = await prisma.assessment.findUnique({
      where: { requirementId_installationId_cycleId: { requirementId: req.id, installationId, cycleId } },
    });
    if (existing?.status === "VALIDADO" || existing?.aiClassification) continue;
    const data = {
      aiClassification: "NAO_SE_APLICA" as const,
      aiCriticality: "NAO_SE_APLICA" as const,
      aiRobustness: null,
      aiInfoSufficiency: "SUFICIENTE" as const,
      aiJustification: POST_FAILURE_NOTE,
      aiConfidence: 0.9,
      status: "EM_REVISAO" as const,
    };
    const saved = existing
      ? await prisma.assessment.update({ where: { id: existing.id }, data })
      : await prisma.assessment.create({ data: { requirementId: req.id, installationId, cycleId, ...data } });
    await prisma.auditLog.create({
      data: { assessmentId: saved.id, actor: "Regra automática", action: "NAO_SE_APLICA_AUTOMATICO", note: "Requisito pós-falha." },
    });
    changed++;
  }
  return changed;
}

export function isAutoNotApplicable(aiJustification: string | null | undefined) {
  return aiJustification === AUTO_NOTE || aiJustification === POST_FAILURE_NOTE;
}
