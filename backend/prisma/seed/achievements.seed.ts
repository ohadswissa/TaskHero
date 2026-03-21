import { PrismaClient, UnlockConditionType } from '@prisma/client';

export async function seedAchievements(prisma: PrismaClient) {
  const achievements = [
    // Level achievements
    {
      slug: 'first-step',
      name: 'First Step',
      description: 'Reach level 2',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 2,
      xpReward: 10,
      coinReward: 5,
      sortOrder: 1,
    },
    {
      slug: 'rising-hero',
      name: 'Rising Hero',
      description: 'Reach level 5',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 5,
      xpReward: 50,
      coinReward: 25,
      sortOrder: 2,
    },
    {
      slug: 'super-hero',
      name: 'Super Hero',
      description: 'Reach level 10',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 10,
      xpReward: 100,
      coinReward: 50,
      sortOrder: 3,
    },

    // Mission count achievements
    {
      slug: 'getting-started',
      name: 'Getting Started',
      description: 'Complete your first mission',
      conditionType: UnlockConditionType.MISSION_COUNT,
      conditionValue: 1,
      xpReward: 10,
      coinReward: 5,
      sortOrder: 10,
    },
    {
      slug: 'mission-master',
      name: 'Mission Master',
      description: 'Complete 10 missions',
      conditionType: UnlockConditionType.MISSION_COUNT,
      conditionValue: 10,
      xpReward: 50,
      coinReward: 25,
      sortOrder: 11,
    },
    {
      slug: 'mission-legend',
      name: 'Mission Legend',
      description: 'Complete 50 missions',
      conditionType: UnlockConditionType.MISSION_COUNT,
      conditionValue: 50,
      xpReward: 200,
      coinReward: 100,
      sortOrder: 12,
    },

    // Streak achievements
    {
      slug: 'on-a-roll',
      name: 'On a Roll',
      description: 'Complete missions 3 days in a row',
      conditionType: UnlockConditionType.STREAK_DAYS,
      conditionValue: 3,
      xpReward: 30,
      coinReward: 15,
      sortOrder: 20,
    },
    {
      slug: 'week-warrior',
      name: 'Week Warrior',
      description: 'Complete missions 7 days in a row',
      conditionType: UnlockConditionType.STREAK_DAYS,
      conditionValue: 7,
      xpReward: 100,
      coinReward: 50,
      sortOrder: 21,
    },
    {
      slug: 'unstoppable',
      name: 'Unstoppable',
      description: 'Complete missions 30 days in a row',
      conditionType: UnlockConditionType.STREAK_DAYS,
      conditionValue: 30,
      xpReward: 500,
      coinReward: 250,
      sortOrder: 22,
    },

    // XP achievements
    {
      slug: 'xp-collector',
      name: 'XP Collector',
      description: 'Earn 500 total XP',
      conditionType: UnlockConditionType.XP_THRESHOLD,
      conditionValue: 500,
      xpReward: 25,
      coinReward: 10,
      sortOrder: 30,
    },
    {
      slug: 'xp-hunter',
      name: 'XP Hunter',
      description: 'Earn 2000 total XP',
      conditionType: UnlockConditionType.XP_THRESHOLD,
      conditionValue: 2000,
      xpReward: 100,
      coinReward: 50,
      sortOrder: 31,
    },

    // Coin achievements
    {
      slug: 'coin-saver',
      name: 'Coin Saver',
      description: 'Earn 100 coins',
      conditionType: UnlockConditionType.COIN_THRESHOLD,
      conditionValue: 100,
      xpReward: 20,
      coinReward: 10,
      sortOrder: 40,
    },
    {
      slug: 'treasure-hunter',
      name: 'Treasure Hunter',
      description: 'Earn 500 coins',
      conditionType: UnlockConditionType.COIN_THRESHOLD,
      conditionValue: 500,
      xpReward: 75,
      coinReward: 50,
      sortOrder: 41,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`   ✓ Created ${achievements.length} achievements`);
}
