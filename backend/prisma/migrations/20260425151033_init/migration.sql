-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "MissionCategory" AS ENUM ('DAILY_CHORE', 'HABIT', 'EDUCATIONAL', 'CREATIVE', 'OUTDOOR', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "UnlockConditionType" AS ENUM ('LEVEL_REACHED', 'XP_THRESHOLD', 'COIN_THRESHOLD', 'MISSION_COUNT', 'STREAK_DAYS', 'ACHIEVEMENT_EARNED', 'PROFILE_COMPLETED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM', 'FAMILY_PLUS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "familyId" TEXT NOT NULL,
    "pin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProfileTheme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionProfileTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfileTheme" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildProfileTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "category" "MissionCategory" NOT NULL,
    "suggestedXp" INTEGER NOT NULL DEFAULT 10,
    "suggestedCoins" INTEGER NOT NULL DEFAULT 5,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimatedMinutes" INTEGER,
    "ageMinimum" INTEGER,
    "ageMaximum" INTEGER,
    "iconUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "category" "MissionCategory" NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "coinReward" INTEGER NOT NULL DEFAULT 5,
    "badgeId" TEXT,
    "unlockItemId" TEXT,
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceRule" JSONB,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "realWorldRewardId" TEXT,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "evidencePrompt" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionAssignment" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "recurrenceIndex" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "MissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "MissionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionApproval" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "feedback" TEXT,
    "xpAwarded" INTEGER NOT NULL,
    "coinsAwarded" INTEGER NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Hero',
    "avatarType" TEXT NOT NULL DEFAULT 'default',
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "equippedItems" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroStats" (
    "id" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "missionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "categoryStats" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "HeroStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "conditionType" "UnlockConditionType" NOT NULL,
    "conditionValue" INTEGER NOT NULL,
    "conditionMeta" JSONB,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "unlockItemId" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAchievement" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChildAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniGame" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "thumbnailUrl" TEXT,
    "conditionType" "UnlockConditionType" NOT NULL,
    "conditionValue" INTEGER NOT NULL,
    "conditionMeta" JSONB,
    "gameType" TEXT NOT NULL,
    "gameConfig" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniGameUnlock" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "miniGameId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesPlayed" INTEGER NOT NULL DEFAULT 0,
    "highScore" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "MiniGameUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "itemType" TEXT NOT NULL,
    "coinCost" INTEGER,
    "unlockCondition" "UnlockConditionType",
    "unlockValue" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildInventory" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acquiredMethod" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ChildInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "conditionType" "UnlockConditionType" NOT NULL,
    "conditionValue" INTEGER NOT NULL,
    "conditionMeta" JSONB,
    "isRealWorld" BOOLEAN NOT NULL DEFAULT true,
    "rewardDetails" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardUnlock" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "timesEarned" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RewardUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2),
    "maxChildProfiles" INTEGER NOT NULL DEFAULT 1,
    "maxActiveMissions" INTEGER NOT NULL DEFAULT 5,
    "maxRewards" INTEGER NOT NULL DEFAULT 3,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "familyId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_familyId_idx" ON "User"("familyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Family_inviteCode_key" ON "Family"("inviteCode");

-- CreateIndex
CREATE INDEX "Family_inviteCode_idx" ON "Family"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_userId_key" ON "ChildProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProfileTheme_slug_key" ON "MissionProfileTheme"("slug");

-- CreateIndex
CREATE INDEX "ChildProfileTheme_childProfileId_idx" ON "ChildProfileTheme"("childProfileId");

-- CreateIndex
CREATE INDEX "ChildProfileTheme_themeId_idx" ON "ChildProfileTheme"("themeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfileTheme_childProfileId_themeId_key" ON "ChildProfileTheme"("childProfileId", "themeId");

-- CreateIndex
CREATE INDEX "MissionTemplate_themeId_idx" ON "MissionTemplate"("themeId");

-- CreateIndex
CREATE INDEX "MissionTemplate_category_idx" ON "MissionTemplate"("category");

-- CreateIndex
CREATE INDEX "Mission_createdById_idx" ON "Mission"("createdById");

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");

-- CreateIndex
CREATE INDEX "Mission_category_idx" ON "Mission"("category");

-- CreateIndex
CREATE INDEX "MissionAssignment_childProfileId_idx" ON "MissionAssignment"("childProfileId");

-- CreateIndex
CREATE INDEX "MissionAssignment_status_idx" ON "MissionAssignment"("status");

-- CreateIndex
CREATE INDEX "MissionAssignment_dueAt_idx" ON "MissionAssignment"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "MissionAssignment_missionId_childProfileId_recurrenceIndex_key" ON "MissionAssignment"("missionId", "childProfileId", "recurrenceIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MissionSubmission_assignmentId_key" ON "MissionSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "MissionSubmission_childProfileId_idx" ON "MissionSubmission"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionApproval_submissionId_key" ON "MissionApproval"("submissionId");

-- CreateIndex
CREATE INDEX "MissionApproval_approvedById_idx" ON "MissionApproval"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_childProfileId_key" ON "Hero"("childProfileId");

-- CreateIndex
CREATE INDEX "HeroStats_heroId_idx" ON "HeroStats"("heroId");

-- CreateIndex
CREATE INDEX "HeroStats_date_idx" ON "HeroStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HeroStats_heroId_date_key" ON "HeroStats"("heroId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE INDEX "ChildAchievement_childProfileId_idx" ON "ChildAchievement"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildAchievement_childProfileId_achievementId_key" ON "ChildAchievement"("childProfileId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "MiniGame_slug_key" ON "MiniGame"("slug");

-- CreateIndex
CREATE INDEX "MiniGameUnlock_childProfileId_idx" ON "MiniGameUnlock"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MiniGameUnlock_childProfileId_miniGameId_key" ON "MiniGameUnlock"("childProfileId", "miniGameId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_slug_key" ON "InventoryItem"("slug");

-- CreateIndex
CREATE INDEX "ChildInventory_childProfileId_idx" ON "ChildInventory"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildInventory_childProfileId_itemId_key" ON "ChildInventory"("childProfileId", "itemId");

-- CreateIndex
CREATE INDEX "Reward_familyId_idx" ON "Reward"("familyId");

-- CreateIndex
CREATE INDEX "RewardUnlock_childProfileId_idx" ON "RewardUnlock"("childProfileId");

-- CreateIndex
CREATE INDEX "RewardUnlock_rewardId_idx" ON "RewardUnlock"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_familyId_key" ON "Subscription"("familyId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_familyId_idx" ON "AuditLog"("familyId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfileTheme" ADD CONSTRAINT "ChildProfileTheme_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfileTheme" ADD CONSTRAINT "ChildProfileTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "MissionProfileTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTemplate" ADD CONSTRAINT "MissionTemplate_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "MissionProfileTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_realWorldRewardId_fkey" FOREIGN KEY ("realWorldRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAssignment" ADD CONSTRAINT "MissionAssignment_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAssignment" ADD CONSTRAINT "MissionAssignment_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "MissionAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionApproval" ADD CONSTRAINT "MissionApproval_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "MissionSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionApproval" ADD CONSTRAINT "MissionApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroStats" ADD CONSTRAINT "HeroStats_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAchievement" ADD CONSTRAINT "ChildAchievement_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAchievement" ADD CONSTRAINT "ChildAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGameUnlock" ADD CONSTRAINT "MiniGameUnlock_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGameUnlock" ADD CONSTRAINT "MiniGameUnlock_miniGameId_fkey" FOREIGN KEY ("miniGameId") REFERENCES "MiniGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInventory" ADD CONSTRAINT "ChildInventory_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInventory" ADD CONSTRAINT "ChildInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardUnlock" ADD CONSTRAINT "RewardUnlock_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardUnlock" ADD CONSTRAINT "RewardUnlock_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
