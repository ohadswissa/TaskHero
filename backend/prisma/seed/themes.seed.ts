import { PrismaClient } from '@prisma/client';

export async function seedThemes(prisma: PrismaClient) {
  const themes = [
    {
      slug: 'daily-life',
      name: 'Daily Life',
      description: 'Everyday tasks and chores to help around the house',
      color: '#4CAF50',
      sortOrder: 1,
    },
    {
      slug: 'nature-explorer',
      name: 'Nature Explorer',
      description: 'Discover the wonders of nature and the outdoors',
      color: '#8BC34A',
      sortOrder: 2,
    },
    {
      slug: 'food-cooking',
      name: 'Food & Cooking',
      description: 'Learn about food, nutrition, and cooking skills',
      color: '#FF9800',
      sortOrder: 3,
    },
    {
      slug: 'history-adventure',
      name: 'History Adventures',
      description: 'Explore the fascinating stories of the past',
      color: '#795548',
      sortOrder: 4,
    },
    {
      slug: 'creativity-studio',
      name: 'Creativity Studio',
      description: 'Express yourself through art, music, and crafts',
      color: '#E91E63',
      sortOrder: 5,
    },
    {
      slug: 'fitness-movement',
      name: 'Fitness & Movement',
      description: 'Stay active and healthy through physical activities',
      color: '#2196F3',
      sortOrder: 6,
    },
  ];

  for (const theme of themes) {
    await prisma.missionProfileTheme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
  }

  console.log(`   ✓ Created ${themes.length} themes`);
}
