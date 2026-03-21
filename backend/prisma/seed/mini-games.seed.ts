import { PrismaClient, UnlockConditionType } from '@prisma/client';

export async function seedMiniGames(prisma: PrismaClient) {
  const games = [
    {
      slug: 'tap-collector',
      name: 'Tap Collector',
      description: 'Tap falling items before they disappear! How many can you catch?',
      gameType: 'tap-collector',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 1, // Available immediately
      gameConfig: {
        duration: 30, // seconds
        spawnRate: 1.5, // items per second
        itemTypes: ['star', 'coin', 'gem'],
        pointValues: { star: 1, coin: 2, gem: 5 },
      },
      sortOrder: 1,
    },
    {
      slug: 'memory-match',
      name: 'Memory Match',
      description: 'Find matching pairs of cards! Test your memory skills.',
      gameType: 'memory',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 3, // Unlocked at level 3
      gameConfig: {
        gridSize: 4, // 4x4 grid
        themes: ['animals', 'food', 'nature'],
        timeBonus: true,
      },
      sortOrder: 2,
    },
    {
      slug: 'quick-quiz',
      name: 'Quick Quiz',
      description: 'Answer fun trivia questions and earn bonus points!',
      gameType: 'quiz',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 5, // Unlocked at level 5
      gameConfig: {
        questionsPerRound: 5,
        timePerQuestion: 15, // seconds
        categories: ['general', 'nature', 'history'],
      },
      sortOrder: 3,
    },
    {
      slug: 'speed-sort',
      name: 'Speed Sort',
      description: 'Sort items into the correct categories as fast as you can!',
      gameType: 'sorting',
      conditionType: UnlockConditionType.LEVEL_REACHED,
      conditionValue: 7, // Unlocked at level 7
      isPremiumOnly: true,
      gameConfig: {
        duration: 45,
        categories: ['fruits', 'vegetables'],
        difficultyLevels: ['easy', 'medium', 'hard'],
      },
      sortOrder: 4,
    },
  ];

  for (const game of games) {
    await prisma.miniGame.upsert({
      where: { slug: game.slug },
      update: game,
      create: game,
    });
  }

  console.log(`   ✓ Created ${games.length} mini-games`);
}
