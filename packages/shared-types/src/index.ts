// User & Authentication Types
export enum UserRole {
  PARENT = 'PARENT',
  CHILD = 'CHILD',
}

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    role: UserRole;
    familyId: string;
    displayName?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  familyName?: string;
  timezone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChildLoginRequest {
  familyCode: string;
  pin: string;
}

// Family Types
export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// Profile Types
export interface ParentProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChildProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  hero?: Hero;
  createdAt: string;
  updatedAt: string;
}

// Mission Types
export enum MissionCategory {
  DAILY_CHORE = 'DAILY_CHORE',
  HABIT = 'HABIT',
  EDUCATIONAL = 'EDUCATIONAL',
  CREATIVE = 'CREATIVE',
  OUTDOOR = 'OUTDOOR',
  PHYSICAL = 'PHYSICAL',
}

// Demo enums (mirror Prisma enums introduced in M1)
export enum TraitCategory {
  STRENGTH = 'STRENGTH',
  WISDOM = 'WISDOM',
  HEART = 'HEART',
}

export enum CreatureSpecies {
  FOREST_PUP = 'FOREST_PUP',
  SKY_SPRITE = 'SKY_SPRITE',
  STONE_CUB = 'STONE_CUB',
}

export enum EvolutionStage {
  EGG = 'EGG',
  BABY = 'BABY',
  ADOLESCENT = 'ADOLESCENT',
  ADULT = 'ADULT',
}

export enum RewardStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  ARCHIVED = 'ARCHIVED',
}

export enum MissionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  category: MissionCategory;
  xpReward: number;
  coinReward: number;
  recurrenceType: RecurrenceType;
  status: MissionStatus;
  requiresEvidence: boolean;
  evidencePrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionAssignment {
  id: string;
  missionId: string;
  childProfileId: string;
  status: AssignmentStatus;
  assignedAt: string;
  dueAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  mission?: Mission;
}

export interface MissionSubmission {
  id: string;
  assignmentId: string;
  childProfileId: string;
  notes: string | null;
  photoUrls: string[];
  submittedAt: string;
}

// =========================================================================
// Approvals (M6) — parent verify loop
// =========================================================================

/** Shape returned by `GET /approvals/pending`. */
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

/** Shape of `POST /approvals/:assignmentId/verify` response. */
export interface VerifyResponse {
  assignmentId: string;
  decision: 'APPROVED' | 'REJECTED';
  approvalId: string;
  awarded: VerifyAwarded | null;
  evolution: VerifyEvolution | null;
  reward: VerifyReward | null;
  notificationId: string | null;
}

/** Convenience alias used by the mobile client (M5a). */
export type Submission = MissionSubmission;

/** Hero's Wisdom card payload — mission joined with its assignment. */
export interface MissionWithAssignment {
  assignment: MissionAssignment;
  mission: Mission;
}

// Progression Types
export interface Hero {
  id: string;
  childProfileId: string;
  name: string;
  avatarType: string;
  level: number;
  currentXp: number;
  totalXp: number;
  coins: number;
  totalCoinsEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  equippedItems: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number; // 0-1
}

// Achievement Types
export enum UnlockConditionType {
  LEVEL_REACHED = 'LEVEL_REACHED',
  XP_THRESHOLD = 'XP_THRESHOLD',
  COIN_THRESHOLD = 'COIN_THRESHOLD',
  MISSION_COUNT = 'MISSION_COUNT',
  STREAK_DAYS = 'STREAK_DAYS',
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  conditionType: UnlockConditionType;
  conditionValue: number;
  xpReward: number;
  coinReward: number;
  isSecret: boolean;
  isActive: boolean;
}

export interface ChildAchievement {
  id: string;
  childProfileId: string;
  achievementId: string;
  achievement?: Achievement;
  currentProgress: number;
  isComplete: boolean;
  unlockedAt: string;
}

// Reward Types
export interface Reward {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  conditionType: UnlockConditionType;
  conditionValue: number;
  isRealWorld: boolean;
  rewardDetails: string | null;
  isActive: boolean;
  isRepeatable: boolean;
}

export interface RewardUnlock {
  id: string;
  childProfileId: string;
  rewardId: string;
  reward?: Reward;
  unlockedAt: string;
  claimedAt: string | null;
  timesEarned: number;
}

// Mini-Game Types
export interface MiniGame {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  thumbnailUrl: string | null;
  gameType: string;
  conditionType: UnlockConditionType;
  conditionValue: number;
  isActive: boolean;
  isPremiumOnly: boolean;
}

export interface MiniGameUnlock {
  id: string;
  childProfileId: string;
  miniGameId: string;
  miniGame?: MiniGame;
  timesPlayed: number;
  highScore: number;
  lastPlayedAt: string | null;
  unlockedAt: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  itemType: string;
  coinCost: number | null;
  unlockCondition: UnlockConditionType | null;
  unlockValue: number | null;
  isActive: boolean;
  isPremiumOnly: boolean;
}

export interface ChildInventoryItem {
  id: string;
  childProfileId: string;
  itemId: string;
  item?: InventoryItem;
  acquiredAt: string;
  acquiredMethod: string;
  quantity: number;
}

// Mission Profile/Theme Types
export interface MissionProfileTheme {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface MissionTemplate {
  id: string;
  themeId: string;
  title: string;
  description: string;
  instructions: string | null;
  category: MissionCategory;
  suggestedXp: number;
  suggestedCoins: number;
  difficulty: number;
  estimatedMinutes: number | null;
  ageMinimum: number | null;
  ageMaximum: number | null;
  tags: string[];
  isActive: boolean;
}

// Notification Types
export type NotificationType =
  | 'mission_assigned'
  | 'mission_submitted'
  | 'mission_approved'
  | 'mission_rejected'
  | 'level_up'
  | 'achievement_unlocked'
  | 'reward_unlocked'
  | 'streak_milestone'
  | 'hero_mail';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/**
 * Polling-shaped notification row returned by GET /notifications/mine.
 * Mirrors NotificationDto on the backend; `type` is a free-form string
 * column server-side so we keep it as string here too (consumers narrow
 * by type === 'hero_mail' etc).
 */
export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPollResponse {
  notifications: NotificationRow[];
  /** Authoritative server time at response — pass as next `since`. */
  serverTime: string;
}

/**
 * Payload shape inside `NotificationRow.data` when `type === 'hero_mail'`.
 * Source: backend/src/modules/approvals/approvals.service.ts step 7
 * (notification.create({ data: { ... } })). All fields except the trait
 * + mission identifiers can be null depending on whether the verification
 * triggered a care-item / evolution / reward unlock.
 */
export interface HeroMailData {
  assignmentId: string;
  parentMessage: string | null;
  missionTitle: string;
  traitCategory: TraitCategory;
  careItemId: string | null;
  careItemName: string;
  xpAwarded: number;
  coinsAwarded: number;
  /** Non-null only when the verification caused an EvolutionStage transition. */
  evolutionStage: EvolutionStage | null;
  /** Non-null only when the verification crossed the reward coin threshold. */
  rewardUnlockedId: string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Dashboard Types
export interface ParentDashboard {
  family: Family;
  children: ChildProfile[];
  todaysMissions: MissionAssignment[];
  pendingApprovals: MissionSubmission[];
  recentActivity: any[];
}

export interface ChildDashboard {
  profile: ChildProfile;
  hero: Hero;
  levelProgress: LevelProgress;
  availableMissions: MissionAssignment[];
  recentAchievements: ChildAchievement[];
  unlockedGames: MiniGameUnlock[];
  unlockedRewards: RewardUnlock[];
}
