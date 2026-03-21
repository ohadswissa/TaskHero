import { PrismaClient, MissionCategory } from '@prisma/client';

export async function seedTemplates(prisma: PrismaClient) {
  // Get themes
  const themes = await prisma.missionProfileTheme.findMany();
  const themeMap = new Map(themes.map(t => [t.slug, t.id]));

  const templates = [
    // Daily Life
    {
      themeId: themeMap.get('daily-life')!,
      title: 'Make Your Bed',
      description: 'Start the day by making your bed neat and tidy',
      instructions: 'Pull up the sheets, arrange the pillows, and smooth out the blanket',
      category: MissionCategory.DAILY_CHORE,
      suggestedXp: 10,
      suggestedCoins: 5,
      difficulty: 1,
      estimatedMinutes: 5,
    },
    {
      themeId: themeMap.get('daily-life')!,
      title: 'Tidy Your Room',
      description: 'Put all toys and items back in their places',
      instructions: 'Pick up items from the floor, organize your desk, and put toys in their storage',
      category: MissionCategory.DAILY_CHORE,
      suggestedXp: 20,
      suggestedCoins: 10,
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      themeId: themeMap.get('daily-life')!,
      title: 'Set the Table',
      description: 'Help prepare the table for a meal',
      instructions: 'Place plates, utensils, napkins, and cups for each family member',
      category: MissionCategory.DAILY_CHORE,
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 1,
      estimatedMinutes: 10,
    },
    {
      themeId: themeMap.get('daily-life')!,
      title: 'Brush Teeth (Morning)',
      description: 'Brush your teeth after waking up',
      instructions: 'Brush for at least 2 minutes, covering all areas of your teeth',
      category: MissionCategory.HABIT,
      suggestedXp: 5,
      suggestedCoins: 3,
      difficulty: 1,
      estimatedMinutes: 3,
    },
    {
      themeId: themeMap.get('daily-life')!,
      title: 'Brush Teeth (Evening)',
      description: 'Brush your teeth before bed',
      instructions: 'Brush for at least 2 minutes, covering all areas of your teeth',
      category: MissionCategory.HABIT,
      suggestedXp: 5,
      suggestedCoins: 3,
      difficulty: 1,
      estimatedMinutes: 3,
    },

    // Nature Explorer
    {
      themeId: themeMap.get('nature-explorer')!,
      title: 'Identify 3 Plants',
      description: 'Go outside and identify three different plants',
      instructions: 'Look around your garden or park and name three different plants you see',
      category: MissionCategory.EDUCATIONAL,
      suggestedXp: 25,
      suggestedCoins: 15,
      difficulty: 2,
      estimatedMinutes: 20,
    },
    {
      themeId: themeMap.get('nature-explorer')!,
      title: 'Nature Walk',
      description: 'Take a 15-minute walk outside and observe nature',
      instructions: 'Walk outside and notice birds, insects, plants, and weather',
      category: MissionCategory.OUTDOOR,
      suggestedXp: 20,
      suggestedCoins: 10,
      difficulty: 1,
      estimatedMinutes: 15,
    },
    {
      themeId: themeMap.get('nature-explorer')!,
      title: 'Collect Interesting Leaves',
      description: 'Find and collect 5 different types of leaves',
      instructions: 'Look for leaves of different shapes, sizes, and colors',
      category: MissionCategory.OUTDOOR,
      suggestedXp: 20,
      suggestedCoins: 12,
      difficulty: 2,
      estimatedMinutes: 30,
    },

    // Food & Cooking
    {
      themeId: themeMap.get('food-cooking')!,
      title: 'Help Prepare Salad',
      description: 'Assist in making a fresh salad for the family',
      instructions: 'Wash vegetables, tear lettuce, and mix ingredients in a bowl',
      category: MissionCategory.EDUCATIONAL,
      suggestedXp: 25,
      suggestedCoins: 15,
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      themeId: themeMap.get('food-cooking')!,
      title: 'Identify 5 Ingredients',
      description: 'Learn about 5 ingredients in your kitchen',
      instructions: 'Find 5 items in the kitchen and learn what they are used for',
      category: MissionCategory.EDUCATIONAL,
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 1,
      estimatedMinutes: 10,
    },

    // Creativity Studio
    {
      themeId: themeMap.get('creativity-studio')!,
      title: 'Draw Something',
      description: 'Create a drawing of anything you imagine',
      instructions: 'Use paper and colors to draw something from your imagination',
      category: MissionCategory.CREATIVE,
      suggestedXp: 20,
      suggestedCoins: 10,
      difficulty: 1,
      estimatedMinutes: 20,
    },
    {
      themeId: themeMap.get('creativity-studio')!,
      title: 'Build Something',
      description: 'Build a creation using blocks, LEGO, or craft materials',
      instructions: 'Use your imagination to construct something unique',
      category: MissionCategory.CREATIVE,
      suggestedXp: 25,
      suggestedCoins: 15,
      difficulty: 2,
      estimatedMinutes: 30,
    },
    {
      themeId: themeMap.get('creativity-studio')!,
      title: 'Write a Short Story',
      description: 'Write a short story about anything you like',
      instructions: 'Write at least 5 sentences telling a story with a beginning, middle, and end',
      category: MissionCategory.CREATIVE,
      suggestedXp: 30,
      suggestedCoins: 20,
      difficulty: 3,
      estimatedMinutes: 25,
    },

    // Fitness & Movement
    {
      themeId: themeMap.get('fitness-movement')!,
      title: '10 Jumping Jacks',
      description: 'Do 10 jumping jacks to get your body moving',
      instructions: 'Stand with feet together, then jump spreading legs and raising arms overhead',
      category: MissionCategory.PHYSICAL,
      suggestedXp: 10,
      suggestedCoins: 5,
      difficulty: 1,
      estimatedMinutes: 2,
    },
    {
      themeId: themeMap.get('fitness-movement')!,
      title: '5-Minute Stretch',
      description: 'Do a short stretching routine',
      instructions: 'Stretch your arms, legs, and back gently',
      category: MissionCategory.PHYSICAL,
      suggestedXp: 10,
      suggestedCoins: 5,
      difficulty: 1,
      estimatedMinutes: 5,
    },
    {
      themeId: themeMap.get('fitness-movement')!,
      title: 'Play Outside for 20 Minutes',
      description: 'Go outside and play any active game',
      instructions: 'Run, play catch, ride a bike, or any active outdoor activity',
      category: MissionCategory.PHYSICAL,
      suggestedXp: 25,
      suggestedCoins: 15,
      difficulty: 2,
      estimatedMinutes: 20,
    },

    // History Adventures
    {
      themeId: themeMap.get('history-adventure')!,
      title: 'Read a History Fact',
      description: 'Learn one interesting fact about history',
      instructions: 'Read about a historical event or person and tell a parent what you learned',
      category: MissionCategory.EDUCATIONAL,
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 1,
      estimatedMinutes: 10,
    },
  ];

  let created = 0;
  for (const template of templates) {
    if (template.themeId) {
      await prisma.missionTemplate.create({
        data: template,
      });
      created++;
    }
  }

  console.log(`   ✓ Created ${created} mission templates`);
}
