import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentStatus, RewardStatus, UnlockConditionType, UserRole } from '@prisma/client';
import { PrismaService } from '@/database';
import { CreateRewardDto } from './dto';

/**
 * NOTE on schema mapping (deviation log for M2b):
 *
 * The Reward model has no dedicated `currentProgress` / `targetMissions` /
 * `targetCount` columns. We map the spec's `targetMissions` DTO field onto
 * the existing `conditionValue` integer column and use `conditionType =
 * COIN_THRESHOLD` (which is the only condition type the demo cares about,
 * per plans/demo-flow.md §3.5).
 *
 * Progress is derived at read-time:
 *   - For `/rewards/mine/active`: count of APPROVED assignments since the
 *     reward.createdAt (per M2b spec wording), capped at conditionValue.
 *   - The approvals.verify flow uses Hero.coins vs. conditionValue for
 *     unlock detection (consistent with the existing COIN_THRESHOLD semantics
 *     used elsewhere in the platform).
 *
 * There is no `redeemedAt` column either — we store the redemption timestamp
 * in the existing `redeemedAt` Reward field (which DOES exist; confirmed in
 * schema.prisma line 711).
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

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
   * Parent creates a new reward goal for a child. Enforces single-active goal:
   * any existing ACTIVE reward for that child is archived in the same tx.
   */
  async create(userId: string, familyId: string, dto: CreateRewardDto) {
    await this.resolveParentProfileId(userId);

    // Validate the child belongs to the parent's family
    const child = await this.prisma.childProfile.findUnique({
      where: { id: dto.childProfileId },
      select: { user: { select: { familyId: true, role: true } } },
    });
    if (!child || child.user.role !== UserRole.CHILD) {
      throw new NotFoundException('Child profile not found');
    }
    if (child.user.familyId !== familyId) {
      throw new ForbiddenException('Child does not belong to your family');
    }

    return this.prisma.$transaction(async (tx) => {
      // Archive existing ACTIVE rewards for this child
      await tx.reward.updateMany({
        where: {
          familyId,
          status: RewardStatus.ACTIVE,
          targetChildProfileId: dto.childProfileId,
        },
        data: { status: RewardStatus.ARCHIVED },
      });

      const created = await tx.reward.create({
        data: {
          familyId,
          name: dto.name,
          description: dto.description,
          iconUrl: dto.icon,
          conditionType: UnlockConditionType.COIN_THRESHOLD,
          conditionValue: dto.targetMissions,
          isRealWorld: true,
          rewardDetails: dto.description ?? null,
          status: RewardStatus.ACTIVE,
          targetChildProfileId: dto.childProfileId,
        },
      });

      this.logger.log(
        `Created reward "${created.name}" (${created.id}) target=${dto.targetMissions} for child ${dto.childProfileId}`,
      );
      return created;
    });
  }

  /**
   * Parent lists all reward goals across children in their family,
   * grouped by status.
   */
  async listFamily(userId: string, familyId: string) {
    await this.resolveParentProfileId(userId);

    const rewards = await this.prisma.reward.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      active: rewards.filter((r) => r.status === RewardStatus.ACTIVE),
      draft: rewards.filter((r) => r.status === RewardStatus.DRAFT),
      redeemed: rewards.filter((r) => r.status === RewardStatus.REDEEMED),
      archived: rewards.filter((r) => r.status === RewardStatus.ARCHIVED),
    };
  }

  /**
   * Child returns their single ACTIVE reward goal with derived progress.
   * Progress = count of APPROVED assignments since reward.createdAt, capped
   * at conditionValue. `unlocked` is true when progress >= conditionValue.
   */
  async getMineActive(userId: string) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const reward = await this.prisma.reward.findFirst({
      where: {
        status: RewardStatus.ACTIVE,
        targetChildProfileId: childProfileId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reward) {
      return null;
    }

    const progressRaw = await this.prisma.missionAssignment.count({
      where: {
        childProfileId,
        status: AssignmentStatus.APPROVED,
        completedAt: { gte: reward.createdAt },
      },
    });

    const target = reward.conditionValue;
    const progress = Math.min(progressRaw, target);
    const unlocked = progressRaw >= target;

    return { ...reward, progress, target, unlocked };
  }

  /**
   * Child-side: list all ACTIVE family rewards (excluding ones targeted to
   * other children) with per-child derived progress + unlocked flag based
   * on the reward's conditionType. Lightweight, additive endpoint used by
   * the child Rewards screen's "More rewards to chase" shelf.
   */
  async getMineFamily(userId: string, familyId: string) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const hero = await this.prisma.hero.findUnique({
      where: { childProfileId },
      select: { coins: true, totalCoinsEarned: true, currentStreak: true, level: true, totalXp: true },
    });
    const approvedCount = await this.prisma.missionAssignment.count({
      where: { childProfileId, status: AssignmentStatus.APPROVED },
    });

    const rewards = await this.prisma.reward.findMany({
      where: {
        familyId,
        status: RewardStatus.ACTIVE,
        OR: [
          { targetChildProfileId: null },
          { targetChildProfileId: childProfileId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return rewards.map((r) => {
      const target = r.conditionValue;
      let raw = 0;
      switch (r.conditionType) {
        case UnlockConditionType.COIN_THRESHOLD:
          raw = hero?.coins ?? 0;
          break;
        case UnlockConditionType.STREAK_DAYS:
          raw = hero?.currentStreak ?? 0;
          break;
        case UnlockConditionType.MISSION_COUNT:
          raw = approvedCount;
          break;
        case UnlockConditionType.LEVEL_REACHED:
          raw = hero?.level ?? 0;
          break;
        case UnlockConditionType.XP_THRESHOLD:
          raw = hero?.totalXp ?? 0;
          break;
        default:
          raw = 0;
      }
      const progress = Math.min(raw, target);
      const unlocked = raw >= target;
      return { ...r, progress, target, unlocked };
    });
  }

  /**
   * Mark a reward as REDEEMED. Allowed for PARENT (real-world fulfillment)
   * or CHILD (claim flow). Requires the reward to be UNLOCKED via threshold
   * reached. Since RewardStatus has no UNLOCKED state in this schema (status
   * stays ACTIVE until redeemed), we re-derive unlock here: progress must be
   * >= conditionValue for redemption to proceed.
   */
  async redeem(userId: string, familyId: string, role: UserRole, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    if (reward.familyId !== familyId) {
      throw new ForbiddenException('Reward does not belong to your family');
    }
    if (reward.status === RewardStatus.REDEEMED) {
      throw new BadRequestException('Reward is already redeemed');
    }
    if (reward.status !== RewardStatus.ACTIVE) {
      throw new BadRequestException(`Reward in status ${reward.status} cannot be redeemed`);
    }

    // For CHILD role, ensure this is their reward
    if (role === UserRole.CHILD) {
      const childProfileId = await this.resolveChildProfileId(userId);
      if (reward.targetChildProfileId !== childProfileId) {
        throw new ForbiddenException('Reward is not assigned to you');
      }
    } else {
      await this.resolveParentProfileId(userId);
    }

    // Re-derive unlock state via approved missions since createdAt
    if (reward.targetChildProfileId) {
      const progress = await this.prisma.missionAssignment.count({
        where: {
          childProfileId: reward.targetChildProfileId,
          status: AssignmentStatus.APPROVED,
          completedAt: { gte: reward.createdAt },
        },
      });
      if (progress < reward.conditionValue) {
        throw new BadRequestException(
          `Reward not yet unlocked (${progress}/${reward.conditionValue})`,
        );
      }
    }

    const updated = await this.prisma.reward.update({
      where: { id: rewardId },
      data: { status: RewardStatus.REDEEMED, redeemedAt: new Date() },
    });

    this.logger.log(`Reward ${rewardId} redeemed by ${role} user ${userId}`);
    return updated;
  }
}
