import { PrismaClient, MissionCategory, TraitCategory } from '@prisma/client';

export async function seedTemplates(prisma: PrismaClient) {
  // Get themes
  const themes = await prisma.missionProfileTheme.findMany();
  const themeMap = new Map(themes.map(t => [t.slug, t.id]));

  const templates = [
    // ===== Demo "Hero's Path" missions (8 — locked content per plans/demo-flow.md §6) =====
    // All earlier theme templates (daily-life, nature-explorer, food-cooking,
    // creativity-studio, fitness-movement, history-adventure) intentionally
    // removed: they duplicated heros-path content and caused the parent
    // Missions library to render the same quest twice under different traits.
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Tidy your room',
      description: 'Put everything in its place — your space, your peace.',
      instructions: 'Pick things off the floor, make the bed, organize your desk.',
      category: MissionCategory.DAILY_CHORE,
      traitCategory: TraitCategory.STRENGTH,
      heroWisdom:
        "Keeping your space organized helps your brain focus better — your creature is learning Clarity from you.",
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 2,
      estimatedMinutes: 15,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Help cook dinner',
      description: 'Be part of the meal — chop, stir, or set the table.',
      instructions: 'Ask a parent how you can help. Wash hands first.',
      category: MissionCategory.EDUCATIONAL,
      traitCategory: TraitCategory.HEART,
      heroWisdom:
        "Working with others in the kitchen builds teamwork — a skill your creature now carries.",
      suggestedXp: 20,
      suggestedCoins: 10,
      difficulty: 2,
      estimatedMinutes: 20,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Spend 15 min reading',
      description: 'Pick any book you love and read for 15 minutes.',
      instructions: 'Find a quiet spot. Set a timer. Get lost in the story.',
      category: MissionCategory.EDUCATIONAL,
      traitCategory: TraitCategory.WISDOM,
      heroWisdom:
        "Reading builds a bigger world in your mind — your creature is gaining Wisdom with every page.",
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 1,
      estimatedMinutes: 15,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Water the plants',
      description: 'Give the houseplants the drink they need.',
      instructions: 'Check the soil first — water only the dry ones, gently.',
      category: MissionCategory.DAILY_CHORE,
      traitCategory: TraitCategory.HEART,
      heroWisdom:
        "Taking care of living things teaches patience — your creature's Heart is growing stronger.",
      suggestedXp: 10,
      suggestedCoins: 5,
      difficulty: 1,
      estimatedMinutes: 5,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Do your homework without reminders',
      description: 'Start your homework on your own today — no one had to ask.',
      instructions: 'Find your work, sit down, and begin. Take a break if you need.',
      category: MissionCategory.EDUCATIONAL,
      traitCategory: TraitCategory.WISDOM,
      heroWisdom:
        "Starting on your own is one of the hardest skills — your creature is learning Independence.",
      suggestedXp: 25,
      suggestedCoins: 12,
      difficulty: 3,
      estimatedMinutes: 30,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Take out the trash',
      description: 'Empty the trash can and replace the bag.',
      instructions: 'Tie the bag, take it outside, put a new one in.',
      category: MissionCategory.DAILY_CHORE,
      traitCategory: TraitCategory.STRENGTH,
      heroWisdom:
        "Doing small tasks without being asked is how responsibility becomes a habit.",
      suggestedXp: 10,
      suggestedCoins: 5,
      difficulty: 1,
      estimatedMinutes: 5,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Write in your journal',
      description: 'Write a few sentences about your day.',
      instructions: 'No rules — write whatever you want to remember about today.',
      category: MissionCategory.CREATIVE,
      traitCategory: TraitCategory.WISDOM,
      heroWisdom:
        "Putting your thoughts into words helps you understand yourself — your creature is growing wiser.",
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 2,
      estimatedMinutes: 10,
    },
    {
      themeId: themeMap.get('heros-path')!,
      title: 'Go outside for 20 minutes',
      description: 'Step outside and breathe. Move around. Look at the sky.',
      instructions: 'Walk, run, play, sit — just be outside for 20 minutes.',
      category: MissionCategory.OUTDOOR,
      traitCategory: TraitCategory.STRENGTH,
      heroWisdom:
        "Your body and mind both need space to breathe — and so does your creature.",
      suggestedXp: 15,
      suggestedCoins: 8,
      difficulty: 1,
      estimatedMinutes: 20,
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
