import {
  PrismaClient,
  UserRole,
  AssignmentStatus,
  CreatureSpecies,
  EvolutionStage,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedDemoFamily(prisma: PrismaClient) {
  const saltRounds = 12;

  // Check if demo family already exists
  const existingFamily = await prisma.family.findUnique({
    where: { inviteCode: 'DEMO2024' },
  });

  if (existingFamily) {
    console.log('   ⚠ Demo family already exists, skipping...');
    return;
  }

  // Create the Cohen family (login credential remains DEMO2024)
  const family = await prisma.family.create({
    data: {
      name: 'The Cohen Family',
      inviteCode: 'DEMO2024',
      timezone: 'UTC',
    },
  });

  // Create parent user (Maya)
  const parentPasswordHash = await bcrypt.hash('Demo123!', saltRounds);
  const parentUser = await prisma.user.create({
    data: {
      email: 'maya@taskhero.app',
      passwordHash: parentPasswordHash,
      role: UserRole.PARENT,
      familyId: family.id,
      parentProfile: {
        create: {
          displayName: 'Maya',
        },
      },
    },
    include: { parentProfile: true },
  });

  // Create the single child (Liam) with a bumped-up hero so the demo
  // dashboard looks lived-in during recording.
  const childUser = await prisma.user.create({
    data: {
      role: UserRole.CHILD,
      familyId: family.id,
      pin: '1234',
      childProfile: {
        create: {
          displayName: 'Liam',
          dateOfBirth: new Date('2017-05-15'),
          hero: {
            create: {
              name: 'Hero Liam',
              level: 4,
              currentXp: 230,
              totalXp: 680,
              coins: 120,
              totalCoinsEarned: 245,
              currentStreak: 6,
              longestStreak: 9,
              lastActivityAt: new Date(),
            },
          },
        },
      },
    },
    include: { childProfile: { include: { hero: true } } },
  });

  const liam = childUser.childProfile!;
  const parentProfileId = parentUser.parentProfile!.id;

  // ---------------------------------------------------------------------
  // Missions seeded from the "Hero's Path" templates so the parent
  // library + child queue never duplicate ad-hoc content.
  // ---------------------------------------------------------------------
  const herosPath = await prisma.missionTemplate.findMany({
    where: { theme: { slug: 'heros-path' } },
    orderBy: { createdAt: 'asc' },
  });

  if (herosPath.length < 3) {
    console.warn(
      `   ⚠ Expected ≥3 heros-path templates, found ${herosPath.length}. ` +
        'Demo missions may be sparse.',
    );
  }

  async function missionFromTemplate(idx: number) {
    const tpl = herosPath[idx];
    if (!tpl) return null;
    return prisma.mission.create({
      data: {
        title: tpl.title,
        description: tpl.description,
        instructions: tpl.instructions,
        category: tpl.category,
        traitCategory: tpl.traitCategory,
        heroWisdom: tpl.heroWisdom,
        xpReward: tpl.suggestedXp,
        coinReward: tpl.suggestedCoins,
        createdById: parentProfileId,
        templateId: tpl.id,
      },
    });
  }

  // 3 pending missions (the active queue Liam sees on login)
  for (let i = 0; i < Math.min(3, herosPath.length); i++) {
    const mission = await missionFromTemplate(i);
    if (!mission) continue;
    await prisma.missionAssignment.create({
      data: {
        missionId: mission.id,
        childProfileId: liam.id,
        status: AssignmentStatus.PENDING,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Richer demo history: 3 APPROVED past assignments + 2 SUBMITTED
  // assignments waiting on Maya. Wrapped in try/catch so the seed never
  // breaks if schema variants drift.
  // ---------------------------------------------------------------------
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  try {
    // 3 APPROVED, ~1–3 days ago
    for (let i = 0; i < 3; i++) {
      const tpl = herosPath[(i + 3) % herosPath.length];
      if (!tpl) break;
      const completedAt = new Date(now - (i + 1) * dayMs);
      const verifiedAt = new Date(completedAt.getTime() + hourMs);
      const mission = await prisma.mission.create({
        data: {
          title: tpl.title,
          description: tpl.description,
          instructions: tpl.instructions,
          category: tpl.category,
          traitCategory: tpl.traitCategory,
          heroWisdom: tpl.heroWisdom,
          xpReward: tpl.suggestedXp,
          coinReward: tpl.suggestedCoins,
          createdById: parentProfileId,
          templateId: tpl.id,
        },
      });
      const assignment = await prisma.missionAssignment.create({
        data: {
          missionId: mission.id,
          childProfileId: liam.id,
          status: AssignmentStatus.APPROVED,
          assignedAt: new Date(completedAt.getTime() - 2 * hourMs),
          startedAt: new Date(completedAt.getTime() - hourMs),
          completedAt,
        },
      });
      const submission = await prisma.missionSubmission.create({
        data: {
          assignmentId: assignment.id,
          childProfileId: liam.id,
          notes: 'Done!',
          submittedAt: completedAt,
        },
      });
      await prisma.missionApproval.create({
        data: {
          submissionId: submission.id,
          approvedById: parentProfileId,
          decision: 'APPROVED',
          xpAwarded: tpl.suggestedXp,
          coinsAwarded: tpl.suggestedCoins,
          parentMessage: 'Proud of you, Liam!',
          decidedAt: verifiedAt,
        },
      });
    }
  } catch (e) {
    console.warn('   ⚠ Could not seed approved history:', (e as Error).message);
  }

  try {
    // 2 SUBMITTED (waiting on parent verification) so the Approvals tab
    // isn't empty during the recording.
    for (let i = 0; i < 2; i++) {
      const tpl = herosPath[(i + 6) % herosPath.length];
      if (!tpl) break;
      const submittedAt = new Date(now - (i + 1) * hourMs);
      const mission = await prisma.mission.create({
        data: {
          title: tpl.title,
          description: tpl.description,
          instructions: tpl.instructions,
          category: tpl.category,
          traitCategory: tpl.traitCategory,
          heroWisdom: tpl.heroWisdom,
          xpReward: tpl.suggestedXp,
          coinReward: tpl.suggestedCoins,
          createdById: parentProfileId,
          templateId: tpl.id,
        },
      });
      const assignment = await prisma.missionAssignment.create({
        data: {
          missionId: mission.id,
          childProfileId: liam.id,
          status: AssignmentStatus.SUBMITTED,
          assignedAt: new Date(submittedAt.getTime() - 3 * hourMs),
          startedAt: new Date(submittedAt.getTime() - hourMs),
          completedAt: submittedAt,
        },
      });
      await prisma.missionSubmission.create({
        data: {
          assignmentId: assignment.id,
          childProfileId: liam.id,
          notes: i === 0 ? 'Done! It was easy.' : 'Finished — can you check?',
          submittedAt,
        },
      });
    }
  } catch (e) {
    console.warn('   ⚠ Could not seed submitted history:', (e as Error).message);
  }

  // ---------------------------------------------------------------------
  // Creature for Liam — a Forest Pup juvenile so the child screens have
  // visible state. Skip cleanly on schema variance.
  // ---------------------------------------------------------------------
  let sproutId: string | null = null;
  try {
    const sprout = await prisma.creature.create({
      data: {
        childProfileId: liam.id,
        species: CreatureSpecies.FOREST_PUP,
        name: 'Sprout',
        stage: EvolutionStage.ADOLESCENT,
        happiness: 78,
        strengthPoints: 6,
        wisdomPoints: 8,
        heartPoints: 5,
        babyEvolvedAt: new Date(now - 5 * dayMs),
        adolescentEvolvedAt: new Date(now - 2 * dayMs),
      },
    });
    sproutId = sprout.id;
  } catch (e) {
    console.warn('   ⚠ Could not seed creature:', (e as Error).message);
  }

  // Pending care items so the child's shelf is full for the demo recording.
  let careItemsCreated = 0;
  if (sproutId) {
    const careItems = [
      { itemSlug: 'sunberry', traitCategory: 'STRENGTH' as const, happinessDelta: 10 },
      { itemSlug: 'moon_petal', traitCategory: 'WISDOM' as const, happinessDelta: 10 },
      { itemSlug: 'heart_root', traitCategory: 'HEART' as const, happinessDelta: 10 },
      { itemSlug: 'crystal_dew', traitCategory: 'WISDOM' as const, happinessDelta: 12 },
      { itemSlug: 'glimmer_nut', traitCategory: 'STRENGTH' as const, happinessDelta: 8 },
      { itemSlug: 'honey_drop', traitCategory: 'HEART' as const, happinessDelta: 9 },
      { itemSlug: 'star_fruit', traitCategory: 'WISDOM' as const, happinessDelta: 11 },
      { itemSlug: 'cloud_cake', traitCategory: 'HEART' as const, happinessDelta: 12 },
      { itemSlug: 'ember_pepper', traitCategory: 'STRENGTH' as const, happinessDelta: 9 },
      { itemSlug: 'rainbow_jelly', traitCategory: 'HEART' as const, happinessDelta: 10 },
      { itemSlug: 'mint_leaf', traitCategory: 'WISDOM' as const, happinessDelta: 8 },
      { itemSlug: 'sparkle_seed', traitCategory: 'STRENGTH' as const, happinessDelta: 11 },
    ];
    for (const item of careItems) {
      try {
        await prisma.careItem.create({
          data: {
            creatureId: sproutId,
            itemSlug: item.itemSlug,
            traitCategory: item.traitCategory,
            happinessDelta: item.happinessDelta,
            traitPointDelta: 1,
          },
        });
        careItemsCreated++;
      } catch (e) {
        console.warn(
          `   ⚠ Could not seed care item ${item.itemSlug}:`,
          (e as Error).message,
        );
      }
    }
  }

  // ---------------------------------------------------------------------
  // 3 unread notifications for Liam (HeroMail feel)
  // ---------------------------------------------------------------------
  try {
    await prisma.notification.createMany({
      data: [
        {
          userId: childUser.id,
          type: 'mission_assigned',
          title: 'New quest from Maya',
          body: 'Maya assigned you a new Hero\'s Path mission. Open Missions to begin.',
        },
        {
          userId: childUser.id,
          type: 'hero_mail',
          title: 'Hero Mail',
          body: 'Sprout is feeling proud of you — keep going!',
        },
        {
          userId: childUser.id,
          type: 'mission_approved',
          title: 'Mission approved!',
          body: 'Maya approved your last quest. +15 XP added to your hero.',
        },
      ],
    });
  } catch (e) {
    console.warn('   ⚠ Could not seed notifications:', (e as Error).message);
  }

  // ---------------------------------------------------------------------
  // Rewards (family-wide)
  // ---------------------------------------------------------------------
  await prisma.reward.create({
    data: {
      familyId: family.id,
      name: 'Ice Cream Treat',
      description: 'One scoop of your favorite ice cream',
      conditionType: 'COIN_THRESHOLD',
      conditionValue: 50,
      isRealWorld: true,
      rewardDetails: 'Redeemable for one ice cream treat',
    },
  });

  // "Extra Screen Time" — kept in the library but DRAFT so it doesn't
  // compete with the active Pizza Friday quest on /rewards/mine/active.
  await prisma.reward.create({
    data: {
      familyId: family.id,
      name: 'Extra Screen Time',
      description: '30 minutes of extra screen time',
      conditionType: 'MISSION_COUNT',
      conditionValue: 5,
      isRealWorld: true,
      rewardDetails: '30 extra minutes of tablet or TV time',
      status: 'DRAFT',
    },
  });

  // Liam's ACTIVE reward quest — surfaced via GET /rewards/mine/active.
  // Service derives progress from APPROVED assignments where
  // completedAt >= reward.createdAt. We backdate createdAt to 7 days ago
  // so the 3 APPROVED missions (1–3 days ago) count → progress = 3/5.
  try {
    await prisma.reward.create({
      data: {
        familyId: family.id,
        name: 'Family Pizza Friday',
        description: 'Earn 5 quests this week to unlock a pizza night picked by you!',
        conditionType: 'MISSION_COUNT',
        conditionValue: 5,
        isRealWorld: true,
        rewardDetails: 'One pizza night where Liam picks the toppings.',
        status: 'ACTIVE',
        targetChildProfileId: liam.id,
        createdAt: new Date(now - 7 * dayMs),
      },
    });
  } catch (e) {
    console.warn('   ⚠ Could not seed active reward for Liam:', (e as Error).message);
  }

  await prisma.reward.create({
    data: {
      familyId: family.id,
      name: 'Movie Night Pick',
      description: 'You get to pick the family movie',
      conditionType: 'STREAK_DAYS',
      conditionValue: 7,
      isRealWorld: true,
      rewardDetails: 'Choose any family-friendly movie for movie night',
    },
  });

  // Mini-game unlocks intentionally skipped — demo has no mini-games.
  // See plans/demo-flow.md §2 ("Explicitly OUT of demo scope").

  // Give Liam a small bundle of achievements so the trophy shelf isn't empty.
  let achievementsAwarded = 0;
  const achievementSlugs = ['first-step', 'getting-started', 'on-a-roll'];
  for (const slug of achievementSlugs) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { slug },
      });
      if (achievement) {
        await prisma.childAchievement.create({
          data: {
            childProfileId: liam.id,
            achievementId: achievement.id,
            isComplete: true,
          },
        });
        achievementsAwarded++;
      }
    } catch (e) {
      console.warn(
        `   ⚠ Could not award achievement ${slug}:`,
        (e as Error).message,
      );
    }
  }

  // Enable the demo mission profile theme for Liam
  const herosPathTheme = await prisma.missionProfileTheme.findUnique({
    where: { slug: 'heros-path' },
  });

  if (herosPathTheme) {
    await prisma.childProfileTheme.create({
      data: {
        childProfileId: liam.id,
        themeId: herosPathTheme.id,
      },
    });
  }

  console.log('   ✓ Created The Cohen Family with 1 parent (Maya) and 1 child (Liam)');
  console.log('   ✓ Seeded 3 pending + 3 approved + 2 submitted missions, creature, notifications');
  console.log(`   ✓ Seeded ${careItemsCreated} pending care items for Sprout`);
  console.log(`   ✓ Awarded ${achievementsAwarded} achievements to Liam`);
}
