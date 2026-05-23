-- CreateEnum
CREATE TYPE "TraitCategory" AS ENUM ('STRENGTH', 'WISDOM', 'HEART');

-- CreateEnum
CREATE TYPE "CreatureSpecies" AS ENUM ('FOREST_PUP', 'SKY_SPRITE', 'STONE_CUB');

-- CreateEnum
CREATE TYPE "EvolutionStage" AS ENUM ('EGG', 'BABY', 'ADOLESCENT', 'ADULT');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REDEEMED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "heroWisdom" TEXT,
ADD COLUMN     "traitCategory" "TraitCategory";

-- AlterTable
ALTER TABLE "MissionApproval" ADD COLUMN     "parentMessage" TEXT;

-- AlterTable
ALTER TABLE "MissionTemplate" ADD COLUMN     "heroWisdom" TEXT,
ADD COLUMN     "traitCategory" "TraitCategory";

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "redeemedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RewardStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "targetChildProfileId" TEXT;

-- CreateTable
CREATE TABLE "Creature" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "species" "CreatureSpecies" NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "EvolutionStage" NOT NULL DEFAULT 'EGG',
    "happiness" INTEGER NOT NULL DEFAULT 50,
    "lastHappinessTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "strengthPoints" INTEGER NOT NULL DEFAULT 0,
    "wisdomPoints" INTEGER NOT NULL DEFAULT 0,
    "heartPoints" INTEGER NOT NULL DEFAULT 0,
    "babyEvolvedAt" TIMESTAMP(3),
    "adolescentEvolvedAt" TIMESTAMP(3),
    "adolescentDominantTrait" "TraitCategory",
    "adultEvolvedAt" TIMESTAMP(3),
    "adultDominantTrait" "TraitCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareItem" (
    "id" TEXT NOT NULL,
    "creatureId" TEXT NOT NULL,
    "traitCategory" "TraitCategory" NOT NULL,
    "itemSlug" TEXT NOT NULL,
    "happinessDelta" INTEGER NOT NULL DEFAULT 10,
    "traitPointDelta" INTEGER NOT NULL DEFAULT 1,
    "earnedFromAssignmentId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "CareItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creature_childProfileId_key" ON "Creature"("childProfileId");

-- CreateIndex
CREATE INDEX "CareItem_creatureId_idx" ON "CareItem"("creatureId");

-- CreateIndex
CREATE INDEX "CareItem_consumedAt_idx" ON "CareItem"("consumedAt");

-- AddForeignKey
ALTER TABLE "Creature" ADD CONSTRAINT "Creature_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareItem" ADD CONSTRAINT "CareItem_creatureId_fkey" FOREIGN KEY ("creatureId") REFERENCES "Creature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
