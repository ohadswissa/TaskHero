/**
 * Demo-flow types (M3). Mirrors enums + DTOs from the backend.
 * Re-exported from API modules for screen-level consumption.
 *
 * NOTE: These intentionally duplicate packages/shared-types so the mobile
 * app does not depend on the unbuilt workspace package at build time.
 * Keep them in sync — when the monorepo packaging is finalised, swap
 * these for `import { ... } from '@taskhero/shared-types'`.
 */

export type TraitCategory = 'STRENGTH' | 'WISDOM' | 'HEART';
export type CreatureSpecies = 'FOREST_PUP' | 'SKY_SPRITE' | 'STONE_CUB';
export type EvolutionStage = 'EGG' | 'BABY' | 'ADOLESCENT' | 'ADULT';
export type RewardStatus = 'DRAFT' | 'ACTIVE' | 'REDEEMED' | 'ARCHIVED';

export type MissionCategory =
  | 'DAILY_CHORE'
  | 'HABIT'
  | 'EDUCATIONAL'
  | 'CREATIVE'
  | 'OUTDOOR'
  | 'PHYSICAL';

export type AssignmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

// =========================================================================
// Children
// =========================================================================

export interface Hero {
  id: string;
  childProfileId: string;
  name: string;
  level: number;
  currentXp: number;
  totalXp: number;
  coins: number;
  currentStreak: number;
}

export interface ChildProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  hero?: Hero | null;
  user?: { id: string; isActive: boolean };
  createdAt: string;
  updatedAt: string;
}

/** Response from POST /children — includes the freshly generated PIN (cannot be retrieved later). */
export interface CreateChildResponse {
  id: string;
  userId: string;
  displayName: string;
  pin: string;
  hero: Hero | null;
}

export interface CreateChildRequest {
  displayName: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

// =========================================================================
// Mission templates + missions
// =========================================================================

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  traitCategory: TraitCategory | null;
  heroWisdom: string | null;
  suggestedXp: number;
  suggestedCoins: number;
  difficulty: number;
  themeId: string;
  theme: {
    slug: string;
    name: string;
    color: string | null;
  };
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  category: MissionCategory;
  traitCategory: TraitCategory | null;
  heroWisdom: string | null;
  xpReward: number;
  coinReward: number;
  status: string;
  templateId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { assignments: number };
}

export interface CreateMissionRequest {
  title: string;
  description: string;
  category: MissionCategory;
  traitCategory?: TraitCategory;
  heroWisdom?: string;
  xpReward: number;
  coinReward: number;
  instructions?: string;
  templateId?: string;
}

// =========================================================================
// Assignments
// =========================================================================

export interface Assignment {
  id: string;
  missionId: string;
  childProfileId: string;
  status: AssignmentStatus;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  mission?: Mission;
}

export interface Submission {
  id: string;
  assignmentId: string;
  childProfileId: string;
  notes: string | null;
  photoUrls: string[];
  submittedAt: string;
}

export interface CreateAssignmentRequest {
  missionId: string;
  childProfileId: string;
}

// =========================================================================
// Rewards
// =========================================================================

export interface Reward {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  conditionType: string;
  conditionValue: number;
  status: RewardStatus;
  targetChildProfileId: string | null;
  isRealWorld: boolean;
  rewardDetails: string | null;
  redeemedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RewardWithProgress extends Reward {
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface FamilyRewardsResponse {
  active: Reward[];
  draft: Reward[];
  redeemed: Reward[];
  archived: Reward[];
}

export interface CreateRewardRequest {
  childProfileId: string;
  name: string;
  description?: string;
  targetMissions: number;
  icon?: string;
}

// =========================================================================
// Notifications
// =========================================================================

export type NotificationType =
  | 'hero_mail'
  | 'verification_pending'
  | 'mission_assigned'
  | 'mission_submitted'
  | 'mission_approved'
  | 'mission_rejected'
  | 'reward_unlocked';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// =========================================================================
// Approvals (parent-side)
// =========================================================================

/**
 * Shape returned by `GET /approvals/pending`. Mirrors the Prisma
 * `MissionAssignment` row with `mission`, `submission`, and `childProfile`
 * joined in. Field names match the backend exactly.
 */
export interface PendingApprovalRow {
  id: string;
  missionId: string;
  childProfileId: string;
  status: AssignmentStatus;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  mission: {
    id: string;
    title: string;
    description: string;
    instructions: string | null;
    category: MissionCategory;
    traitCategory: TraitCategory | null;
    heroWisdom: string | null;
    xpReward: number;
    coinReward: number;
  };
  submission: {
    id: string;
    notes: string | null;
    photoUrls: string[];
    submittedAt: string;
  } | null;
  childProfile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    userId: string;
  };
}

/** Legacy alias (kept for older imports) — prefer `PendingApprovalRow`. */
export type PendingApproval = PendingApprovalRow;

/** Award block populated only on `approved: true`. */
export interface VerifyAwarded {
  xp: number;
  coins: number;
  trait: TraitCategory;
  careItemId: string | null;
  careItemName: string;
}

export interface VerifyEvolution {
  stage: EvolutionStage;
  justEvolved: boolean;
}

export interface VerifyReward {
  id: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

/** Full shape of `POST /approvals/:assignmentId/verify` response. */
export interface VerifyResponse {
  assignmentId: string;
  decision: 'APPROVED' | 'REJECTED';
  approvalId: string;
  awarded: VerifyAwarded | null;
  evolution: VerifyEvolution | null;
  reward: VerifyReward | null;
  notificationId: string | null;
}
