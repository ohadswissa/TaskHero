import { EvolutionStage } from '@prisma/client';
import { ADOLESCENT_THRESHOLD, ADULT_THRESHOLD, BABY_THRESHOLD } from '@/common/utils/progression';

/**
 * Compute the evolution stage that should correspond to a given count of
 * approved missions. Used by the approvals verify flow after a mission is
 * approved to decide whether to bump `Creature.stage`.
 *
 * Boundaries (from plans/demo-flow.md §3.2):
 *   < 20  → EGG
 *   ≥ 20  → BABY
 *   ≥ 60  → ADOLESCENT
 *   ≥ 120 → ADULT
 *
 * Note: caller is responsible for not regressing a creature still in EGG
 * stage (pre-onboarding) — this helper is purely arithmetic.
 */
export function computeEvolutionStage(approvedMissionsCount: number): EvolutionStage {
  if (approvedMissionsCount >= ADULT_THRESHOLD) return EvolutionStage.ADULT;
  if (approvedMissionsCount >= ADOLESCENT_THRESHOLD) return EvolutionStage.ADOLESCENT;
  if (approvedMissionsCount >= BABY_THRESHOLD) return EvolutionStage.BABY;
  return EvolutionStage.EGG;
}

/** Ordered list of stages, lowest → highest, for "is upgrade?" comparisons. */
const STAGE_ORDER: EvolutionStage[] = [
  EvolutionStage.EGG,
  EvolutionStage.BABY,
  EvolutionStage.ADOLESCENT,
  EvolutionStage.ADULT,
];

export function isStageUpgrade(from: EvolutionStage, to: EvolutionStage): boolean {
  return STAGE_ORDER.indexOf(to) > STAGE_ORDER.indexOf(from);
}
