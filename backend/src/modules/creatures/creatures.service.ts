import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database';
import {
  HAPPINESS_DEFAULT,
  HAPPINESS_MAX,
  HAPPINESS_MIN,
  HAPPINESS_PER_CARE_ITEM,
  SPECIES_META,
  tickHappiness,
} from '@/common/utils/progression';
import { CreatureSpecies, EvolutionStage, TraitCategory } from '@prisma/client';
import { computeEvolutionStage } from '@/modules/approvals/helpers/evolution';
import { DevAdvanceCreatureDto, FeedCreatureDto, OnboardCreatureDto } from './dto';

@Injectable()
export class CreaturesService {
  private readonly logger = new Logger(CreaturesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the ChildProfile.id for the calling child user.
   * Throws if the calling user is not a child or has no profile.
   */
  private async resolveChildProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.childProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException('Child profile not found for current user');
    }
    return profile.id;
  }

  /**
   * Returns the calling child's creature with happiness pre-ticked.
   * Persists the new happiness value + lastHappinessTickAt and returns the
   * updated row including unconsumed pendingCareItems.
   */
  async getMine(userId: string) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const creature = await this.prisma.creature.findUnique({
      where: { childProfileId },
      include: {
        pendingCareItems: { where: { consumedAt: null } },
      },
    });

    if (!creature) {
      throw new NotFoundException('Creature has not been hatched yet');
    }

    const now = new Date();
    const ticked = tickHappiness(creature.happiness, creature.lastHappinessTickAt, now);

    if (ticked === creature.happiness) {
      return creature;
    }

    return this.prisma.creature.update({
      where: { id: creature.id },
      data: { happiness: ticked, lastHappinessTickAt: now },
      include: {
        pendingCareItems: { where: { consumedAt: null } },
      },
    });
  }

  /**
   * Creates the Creature if it doesn't exist. If it exists in EGG stage,
   * updates species/name and transitions to BABY. Returns the Creature.
   */
  async onboard(userId: string, dto: OnboardCreatureDto) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const defaultName = SPECIES_META[dto.species].defaultName;
    const name = dto.name?.trim() || defaultName;

    const existing = await this.prisma.creature.findUnique({
      where: { childProfileId },
    });

    if (!existing) {
      const created = await this.prisma.creature.create({
        data: {
          childProfileId,
          species: dto.species,
          name,
          stage: EvolutionStage.BABY,
          happiness: HAPPINESS_DEFAULT,
          lastHappinessTickAt: new Date(),
        },
        include: { pendingCareItems: { where: { consumedAt: null } } },
      });
      this.logger.log(`Hatched ${created.species} (${created.name}) for child ${childProfileId}`);
      return created;
    }

    if (existing.stage === EvolutionStage.EGG) {
      const updated = await this.prisma.creature.update({
        where: { id: existing.id },
        data: {
          species: dto.species,
          name,
          stage: EvolutionStage.BABY,
        },
        include: { pendingCareItems: { where: { consumedAt: null } } },
      });
      this.logger.log(`Onboarded EGG → BABY for child ${childProfileId}`);
      return updated;
    }

    throw new BadRequestException('Creature is already onboarded');
  }

  /**
   * Consumes a CareItem belonging to the calling child's creature.
   * Applies happinessDelta (clamped) and increments the matching trait counter.
   * Does NOT trigger evolution stage checks — that lives in M2b verification.
   */
  async feed(userId: string, dto: FeedCreatureDto) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const creature = await this.prisma.creature.findUnique({
      where: { childProfileId },
    });
    if (!creature) {
      throw new NotFoundException('Creature has not been hatched yet');
    }

    const careItem = await this.prisma.careItem.findUnique({
      where: { id: dto.careItemId },
    });
    if (!careItem || careItem.creatureId !== creature.id) {
      throw new NotFoundException('Care item not found');
    }
    if (careItem.consumedAt) {
      throw new BadRequestException('Care item has already been consumed');
    }

    const now = new Date();
    const ticked = tickHappiness(creature.happiness, creature.lastHappinessTickAt, now);
    const newHappiness = Math.max(
      HAPPINESS_MIN,
      Math.min(HAPPINESS_MAX, ticked + careItem.happinessDelta),
    );

    const traitField = this.traitColumn(careItem.traitCategory);

    const [, updated] = await this.prisma.$transaction([
      this.prisma.careItem.update({
        where: { id: careItem.id },
        data: { consumedAt: now },
      }),
      this.prisma.creature.update({
        where: { id: creature.id },
        data: {
          happiness: newHappiness,
          lastHappinessTickAt: now,
          [traitField]: { increment: careItem.traitPointDelta },
        },
        include: { pendingCareItems: { where: { consumedAt: null } } },
      }),
    ]);

    return updated;
  }

  /**
   * DEV-ONLY: Fast-forward the calling child's creature by simulating N approved
   * missions. Balanced round-robin across STRENGTH / WISDOM / HEART trait points;
   * each mission adds HAPPINESS_PER_CARE_ITEM happiness (clamped to HAPPINESS_MAX);
   * stage is recomputed from the new trait total and updated if changed.
   *
   * Feature-flag gated by the controller (DEMO_DEV_ENDPOINTS=true OR
   * NODE_ENV !== 'production'). This service method does NOT re-check the flag;
   * the controller is the single gate.
   */
  async devAdvance(userId: string, dto: DevAdvanceCreatureDto) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const creature = await this.prisma.creature.findUnique({
      where: { childProfileId },
    });
    if (!creature) {
      throw new NotFoundException('Creature has not been hatched yet');
    }

    this.logger.warn(
      `[DEV] dev-advance invoked for child ${childProfileId}, +${dto.missions} missions`,
    );

    // Balanced round-robin: STRENGTH, WISDOM, HEART
    const rotation: TraitCategory[] = [
      TraitCategory.STRENGTH,
      TraitCategory.WISDOM,
      TraitCategory.HEART,
    ];
    let addStrength = 0;
    let addWisdom = 0;
    let addHeart = 0;
    for (let i = 0; i < dto.missions; i += 1) {
      const t = rotation[i % rotation.length];
      if (t === TraitCategory.STRENGTH) addStrength += 1;
      else if (t === TraitCategory.WISDOM) addWisdom += 1;
      else addHeart += 1;
    }

    const newStrength = creature.strengthPoints + addStrength;
    const newWisdom = creature.wisdomPoints + addWisdom;
    const newHeart = creature.heartPoints + addHeart;
    const total = newStrength + newWisdom + newHeart;

    const newHappiness = Math.max(
      HAPPINESS_MIN,
      Math.min(HAPPINESS_MAX, creature.happiness + dto.missions * HAPPINESS_PER_CARE_ITEM),
    );

    const targetStage = computeEvolutionStage(total);
    // Don't auto-promote a creature still in EGG (must onboard first); otherwise
    // adopt the computed stage if it has changed.
    const stageChanged = creature.stage !== EvolutionStage.EGG && targetStage !== creature.stage;
    const newStage = stageChanged ? targetStage : creature.stage;

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.creature.update({
        where: { id: creature.id },
        data: {
          strengthPoints: newStrength,
          wisdomPoints: newWisdom,
          heartPoints: newHeart,
          happiness: newHappiness,
          lastHappinessTickAt: now,
          stage: newStage,
          ...(stageChanged && newStage === EvolutionStage.BABY && !creature.babyEvolvedAt
            ? { babyEvolvedAt: now }
            : {}),
          ...(stageChanged &&
          newStage === EvolutionStage.ADOLESCENT &&
          !creature.adolescentEvolvedAt
            ? { adolescentEvolvedAt: now }
            : {}),
          ...(stageChanged && newStage === EvolutionStage.ADULT && !creature.adultEvolvedAt
            ? { adultEvolvedAt: now }
            : {}),
        },
        include: { pendingCareItems: { where: { consumedAt: null } } },
      });
    });

    return {
      creature: updated,
      advanced: dto.missions,
      stageChanged,
      newStage,
    };
  }

  private traitColumn(trait: TraitCategory): 'strengthPoints' | 'wisdomPoints' | 'heartPoints' {
    switch (trait) {
      case TraitCategory.STRENGTH:
        return 'strengthPoints';
      case TraitCategory.WISDOM:
        return 'wisdomPoints';
      case TraitCategory.HEART:
        return 'heartPoints';
      default: {
        // Exhaustiveness — unreachable
        const _exhaustive: never = trait;
        return _exhaustive;
      }
    }
  }

  // Exposed for test scaffolding
  static _speciesDefaultName(species: CreatureSpecies): string {
    return SPECIES_META[species].defaultName;
  }
}
