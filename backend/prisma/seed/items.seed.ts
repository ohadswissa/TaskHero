import { PrismaClient, UnlockConditionType } from '@prisma/client';

export async function seedItems(prisma: PrismaClient) {
  const items = [
    // Avatar items
    {
      slug: 'avatar-knight',
      name: 'Knight Avatar',
      description: 'A brave knight ready for adventure',
      itemType: 'avatar',
      coinCost: null, // Default, free
      sortOrder: 1,
    },
    {
      slug: 'avatar-wizard',
      name: 'Wizard Avatar',
      description: 'A magical wizard with powerful spells',
      itemType: 'avatar',
      coinCost: 50,
      sortOrder: 2,
    },
    {
      slug: 'avatar-astronaut',
      name: 'Astronaut Avatar',
      description: 'An explorer of the cosmos',
      itemType: 'avatar',
      coinCost: 75,
      sortOrder: 3,
    },
    {
      slug: 'avatar-superhero',
      name: 'Superhero Avatar',
      description: 'A mighty hero saving the day',
      itemType: 'avatar',
      coinCost: 100,
      sortOrder: 4,
    },
    {
      slug: 'avatar-ninja',
      name: 'Ninja Avatar',
      description: 'A stealthy warrior of the shadows',
      itemType: 'avatar',
      unlockCondition: UnlockConditionType.LEVEL_REACHED,
      unlockValue: 10,
      sortOrder: 5,
    },

    // Background items
    {
      slug: 'bg-forest',
      name: 'Enchanted Forest',
      description: 'A magical forest background',
      itemType: 'background',
      coinCost: 30,
      sortOrder: 10,
    },
    {
      slug: 'bg-space',
      name: 'Outer Space',
      description: 'The vast cosmos background',
      itemType: 'background',
      coinCost: 50,
      sortOrder: 11,
    },
    {
      slug: 'bg-underwater',
      name: 'Underwater World',
      description: 'Deep sea adventures',
      itemType: 'background',
      coinCost: 50,
      sortOrder: 12,
    },
    {
      slug: 'bg-castle',
      name: 'Royal Castle',
      description: 'A majestic castle background',
      itemType: 'background',
      unlockCondition: UnlockConditionType.MISSION_COUNT,
      unlockValue: 25,
      sortOrder: 13,
    },

    // Badge items
    {
      slug: 'badge-star',
      name: 'Gold Star',
      description: 'Awarded for excellence',
      itemType: 'badge',
      unlockCondition: UnlockConditionType.MISSION_COUNT,
      unlockValue: 5,
      sortOrder: 20,
    },
    {
      slug: 'badge-trophy',
      name: 'Champion Trophy',
      description: 'For reaching level 5',
      itemType: 'badge',
      unlockCondition: UnlockConditionType.LEVEL_REACHED,
      unlockValue: 5,
      sortOrder: 21,
    },
    {
      slug: 'badge-streak',
      name: 'Streak Master',
      description: 'For maintaining a 7-day streak',
      itemType: 'badge',
      unlockCondition: UnlockConditionType.STREAK_DAYS,
      unlockValue: 7,
      sortOrder: 22,
    },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }

  console.log(`   ✓ Created ${items.length} inventory items`);
}
