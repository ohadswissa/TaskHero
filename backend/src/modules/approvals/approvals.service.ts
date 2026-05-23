import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalDecision,
  AssignmentStatus,
  EvolutionStage,
  Prisma,
  RewardStatus,
  TraitCategory,
} from '@prisma/client';
import { PrismaService } from '@/database';
import {
  HAPPINESS_PER_CARE_ITEM,
  careItemForTrait,
  deriveTraitFromCategory,
} from '@/common/utils/progression';
import { VerifyAssignmentDto } from './dto';
import { computeEvolutionStage, isStageUpgrade } from './helpers/evolution';

// =========================================================================
// Notification type literal — kept as a string because the schema's
// Notification.type is a String column, not a Prisma enum. See plans/demo-flow.md
// §4.1. TODO: promote to an enum if/when notifications schema is tightened.
// =========================================================================
const NOTIFICATION_TYPE_HERO_MAIL = 'hero_mail';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveParentProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException('Parent profile not found for current user');
    }
    return profile.id;
  }

  /**
   * List all submissions awaiting verification across the parent's family.
   * Returns assignments in SUBMITTED status with mission, child, and submission
   * data joined for the parent's verify UI.
   */
  async listPending(userId: string, familyId: string) {
    await this.resolveParentProfileId(userId);

    return this.prisma.missionAssignment.findMany({
      where: {
        status: AssignmentStatus.SUBMITTED,
        childProfile: {
          user: { familyId },
        },
      },
      // Oldest first (FIFO) — parents should clear the backlog in submission order.
      orderBy: { completedAt: 'asc' },
      include: {
        mission: true,
        submission: true,
        childProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Verify (approve or reject) a submitted assignment.
   * On approval, runs the full side-effect chain inside a single transaction:
   *   1. Mark assignment APPROVED + create MissionApproval row
   *   2. Award XP/coins on Hero
   *   3. Increment Creature trait counter
   *   4. Spawn a CareItem mapped from traitCategory
   *   5. Check evolution thresholds (based on approved-mission count) and bump stage
   *   6. Advance the child's active Reward goal; flag UNLOCKED if threshold met
   *   7. Create a HERO_MAIL Notification row for the child
   * Any failure rolls back the entire batch.
   */
  async verify(userId: string, familyId: string, assignmentId: string, dto: VerifyAssignmentDto) {
    const parentProfileId = await this.resolveParentProfileId(userId);

    // ---------- Load + authorize (outside transaction; read-only) ----------
    const assignment = await this.prisma.missionAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        mission: true,
        submission: true,
        childProfile: {
          include: {
            user: { select: { id: true, familyId: true } },
            creature: true,
            hero: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (!assignment.submission) {
      throw new BadRequestException('Assignment has no submission to verify');
    }
    if (assignment.status !== AssignmentStatus.SUBMITTED) {
      throw new BadRequestException(
        `Assignment cannot be verified from status ${assignment.status}`,
      );
    }
    if (assignment.childProfile.user.familyId !== familyId) {
      throw new ForbiddenException('Assignment does not belong to your family');
    }

    // Mission must belong to a parent in the same family. We already enforce
    // family scope via the child relation, but double-check the mission creator
    // is a parent in this family for defence in depth.
    const missionCreator = await this.prisma.parentProfile.findUnique({
      where: { id: assignment.mission.createdById },
      select: { user: { select: { familyId: true } } },
    });
    if (!missionCreator || missionCreator.user.familyId !== familyId) {
      throw new ForbiddenException('Mission was not created by a parent in your family');
    }

    const childProfile = assignment.childProfile;
    const childUserId = childProfile.user.id;
    const mission = assignment.mission;
    const submission = assignment.submission;
    const parentMessage = dto.parentMessage?.trim() || undefined;

    // ============ REJECT PATH ============
    if (!dto.approved) {
      const rejected = await this.prisma.$transaction(async (tx) => {
        await tx.missionAssignment.update({
          where: { id: assignment.id },
          data: { status: AssignmentStatus.REJECTED },
        });
        const approval = await tx.missionApproval.create({
          data: {
            submissionId: submission.id,
            approvedById: parentProfileId,
            decision: ApprovalDecision.REJECTED,
            xpAwarded: 0,
            coinsAwarded: 0,
            parentMessage,
          },
        });
        return approval;
      });

      this.logger.log(`Rejected assignment ${assignment.id}`);
      return {
        assignmentId: assignment.id,
        decision: ApprovalDecision.REJECTED,
        approvalId: rejected.id,
        awarded: null,
        evolution: null,
        reward: null,
        notificationId: null,
      };
    }

    // ============ APPROVE PATH ============
    const trait: TraitCategory = mission.traitCategory ?? deriveTraitFromCategory(mission.category);

    const xpAward = mission.xpReward;
    const coinAward = mission.coinReward;

    // CareItem flavor names per category (spec §1 step 3)
    const careItemName = this.careItemDisplayName(trait);

    // Look up the child's active reward (outside tx for read; re-validated inside)
    const activeReward = await this.prisma.reward.findFirst({
      where: {
        familyId,
        status: RewardStatus.ACTIVE,
        OR: [{ targetChildProfileId: childProfile.id }, { targetChildProfileId: null }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1) Mark assignment APPROVED
      await tx.missionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.APPROVED,
          completedAt: assignment.completedAt ?? now,
        },
      });

      // 2) Create MissionApproval row
      const approval = await tx.missionApproval.create({
        data: {
          submissionId: submission.id,
          approvedById: parentProfileId,
          decision: ApprovalDecision.APPROVED,
          xpAwarded: xpAward,
          coinsAwarded: coinAward,
          parentMessage,
        },
      });

      // 3) Award XP + coins on Hero (if Hero row exists)
      if (childProfile.hero) {
        await tx.hero.update({
          where: { id: childProfile.hero.id },
          data: {
            currentXp: { increment: xpAward },
            totalXp: { increment: xpAward },
            coins: { increment: coinAward },
            totalCoinsEarned: { increment: coinAward },
            lastActivityAt: now,
          },
        });
      }

      // 4) Increment creature trait counter + spawn CareItem
      // Evolution check happens after this.
      let creatureAfter = childProfile.creature;
      let evolutionInfo: { stage: EvolutionStage; justEvolved: boolean } | null = null;
      let careItemId: string | null = null;

      if (childProfile.creature) {
        const traitField = this.traitColumn(trait);
        creatureAfter = await tx.creature.update({
          where: { id: childProfile.creature.id },
          data: {
            [traitField]: { increment: 1 },
          },
        });

        // Spawn one CareItem
        const careSpec = careItemForTrait(trait);
        const careItem = await tx.careItem.create({
          data: {
            creatureId: childProfile.creature.id,
            traitCategory: trait,
            itemSlug: careSpec.itemSlug,
            happinessDelta: HAPPINESS_PER_CARE_ITEM,
            traitPointDelta: 0, // trait point already applied via mission verification
            earnedFromAssignmentId: assignment.id,
          },
        });
        careItemId = careItem.id;

        // 5) Evolution check — count APPROVED assignments incl. this one
        const approvedCount = await tx.missionAssignment.count({
          where: {
            childProfileId: childProfile.id,
            status: AssignmentStatus.APPROVED,
          },
        });

        const targetStage = computeEvolutionStage(approvedCount);
        const currentStage = creatureAfter.stage;

        // Only upgrade — never regress, never auto-promote EGG (must onboard first)
        if (currentStage !== EvolutionStage.EGG && isStageUpgrade(currentStage, targetStage)) {
          const evolutionData: Prisma.CreatureUpdateInput = { stage: targetStage };
          if (targetStage === EvolutionStage.BABY && !creatureAfter.babyEvolvedAt) {
            evolutionData.babyEvolvedAt = now;
          }
          if (targetStage === EvolutionStage.ADOLESCENT && !creatureAfter.adolescentEvolvedAt) {
            evolutionData.adolescentEvolvedAt = now;
            evolutionData.adolescentDominantTrait = trait;
          }
          if (targetStage === EvolutionStage.ADULT && !creatureAfter.adultEvolvedAt) {
            evolutionData.adultEvolvedAt = now;
            evolutionData.adultDominantTrait = trait;
          }
          creatureAfter = await tx.creature.update({
            where: { id: creatureAfter.id },
            data: evolutionData,
          });
          evolutionInfo = { stage: targetStage, justEvolved: true };
        } else {
          evolutionInfo = { stage: currentStage, justEvolved: false };
        }
      }

      // 6) Reward goal progress — count APPROVED missions for child since reward.createdAt
      let rewardInfo: {
        id: string;
        progress: number;
        target: number;
        unlocked: boolean;
      } | null = null;

      if (activeReward) {
        // Re-fetch inside tx to avoid stale read (status may have flipped concurrently)
        const reward = await tx.reward.findUnique({ where: { id: activeReward.id } });
        if (reward && reward.status === RewardStatus.ACTIVE) {
          // Demo Reward uses COIN_THRESHOLD per plans/demo-flow.md §3.5. We use
          // conditionValue as the coin target and compare against Hero.coins.
          // M2c may swap to mission-count progress; tracking here is read-only.
          const hero = childProfile.hero
            ? await tx.hero.findUnique({
                where: { id: childProfile.hero.id },
                select: { coins: true },
              })
            : null;
          const currentCoins = hero?.coins ?? 0;
          const target = reward.conditionValue;
          const unlocked = currentCoins >= target;

          if (unlocked) {
            await tx.reward.update({
              where: { id: reward.id },
              data: { status: RewardStatus.ACTIVE }, // stays ACTIVE until parent redeems
            });
            // Create a RewardUnlock row (idempotent on (childProfileId, rewardId) is not
            // enforced at the schema level; we guard with findFirst).
            const existingUnlock = await tx.rewardUnlock.findFirst({
              where: { childProfileId: childProfile.id, rewardId: reward.id },
            });
            if (!existingUnlock) {
              await tx.rewardUnlock.create({
                data: { childProfileId: childProfile.id, rewardId: reward.id },
              });
            }
          }

          rewardInfo = {
            id: reward.id,
            progress: Math.min(currentCoins, target),
            target,
            unlocked,
          };
        }
      }

      // 7) Notification (Hero Mail) for the child
      const notification = await tx.notification.create({
        data: {
          userId: childUserId,
          type: NOTIFICATION_TYPE_HERO_MAIL,
          title: 'A message from your parent!',
          body: parentMessage ?? `Mission verified: ${mission.title}`,
          data: {
            assignmentId: assignment.id,
            parentMessage: parentMessage ?? null,
            missionTitle: mission.title,
            traitCategory: trait,
            careItemId,
            careItemName,
            xpAwarded: xpAward,
            coinsAwarded: coinAward,
            evolutionStage: evolutionInfo?.justEvolved ? evolutionInfo.stage : null,
            rewardUnlockedId: rewardInfo?.unlocked ? rewardInfo.id : null,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        approvalId: approval.id,
        careItemId,
        evolution: evolutionInfo,
        reward: rewardInfo,
        notificationId: notification.id,
      };
    });

    this.logger.log(
      `Approved assignment ${assignment.id} for child ${childProfile.id}: ` +
        `+${xpAward}xp +${coinAward}coins trait=${trait}` +
        (result.evolution?.justEvolved ? ` → evolved to ${result.evolution.stage}` : ''),
    );

    return {
      assignmentId: assignment.id,
      decision: ApprovalDecision.APPROVED,
      approvalId: result.approvalId,
      awarded: {
        xp: xpAward,
        coins: coinAward,
        trait,
        careItemId: result.careItemId,
        careItemName,
      },
      evolution: result.evolution,
      reward: result.reward,
      notificationId: result.notificationId,
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
        const _exhaustive: never = trait;
        return _exhaustive;
      }
    }
  }

  private careItemDisplayName(trait: TraitCategory): string {
    switch (trait) {
      case TraitCategory.STRENGTH:
        return 'Hearty Stew';
      case TraitCategory.WISDOM:
        return 'Riddle Scroll';
      case TraitCategory.HEART:
        return 'Cozy Scarf';
      default: {
        const _exhaustive: never = trait;
        return _exhaustive;
      }
    }
  }
}
