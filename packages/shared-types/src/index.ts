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
  | 'streak_milestone';

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
