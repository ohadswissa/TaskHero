import { PrismaClient, UserRole, MissionCategory, AssignmentStatus } from '@prisma/client';
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

  // Create demo family
  const family = await prisma.family.create({
    data: {
      name: 'The Demo Family',
      inviteCode: 'DEMO2024',
      timezone: 'UTC',
    },
  });

  // Create parent user
  const parentPasswordHash = await bcrypt.hash('Demo123!', saltRounds);
  const parentUser = await prisma.user.create({
    data: {
      email: 'demo@taskhero.app',
      passwordHash: parentPasswordHash,
      role: UserRole.PARENT,
      familyId: family.id,
      parentProfile: {
        create: {
          displayName: 'Demo Parent',
        },
      },
    },
    include: { parentProfile: true },
  });

  // Create child user 1
  const child1User = await prisma.user.create({
    data: {
      role: UserRole.CHILD,
      familyId: family.id,
      pin: '1234',
      childProfile: {
        create: {
          displayName: 'Alex',
          dateOfBirth: new Date('2017-05-15'),
          hero: {
            create: {
              name: 'Super Alex',
              level: 3,
              currentXp: 150,
              totalXp: 450,
              coins: 75,
              totalCoinsEarned: 120,
              currentStreak: 5,
              longestStreak: 7,
              lastActivityAt: new Date(),
            },
          },
        },
      },
    },
    include: { childProfile: { include: { hero: true } } },
  });

  // Create child user 2
  const child2User = await prisma.user.create({
    data: {
      role: UserRole.CHILD,
      familyId: family.id,
      pin: '5678',
      childProfile: {
        create: {
          displayName: 'Emma',
          dateOfBirth: new Date('2019-08-22'),
          hero: {
            create: {
              name: 'Princess Emma',
              level: 2,
              currentXp: 50,
              totalXp: 150,
              coins: 40,
              totalCoinsEarned: 55,
              currentStreak: 2,
              longestStreak: 4,
              lastActivityAt: new Date(),
            },
          },
        },
      },
    },
    include: { childProfile: { include: { hero: true } } },
  });

  // Create some missions
  const mission1 = await prisma.mission.create({
    data: {
      title: 'Make Your Bed',
      description: 'Start the day by making your bed neat and tidy',
      instructions: 'Pull up the sheets, arrange pillows, smooth out the blanket',
      category: MissionCategory.DAILY_CHORE,
      xpReward: 10,
      coinReward: 5,
      createdById: parentUser.parentProfile!.id,
    },
  });

  const mission2 = await prisma.mission.create({
    data: {
      title: 'Read for 15 Minutes',
      description: 'Spend 15 minutes reading a book of your choice',
      instructions: 'Find a quiet spot and read for at least 15 minutes',
      category: MissionCategory.EDUCATIONAL,
      xpReward: 20,
      coinReward: 10,
      createdById: parentUser.parentProfile!.id,
    },
  });

  const mission3 = await prisma.mission.create({
    data: {
      title: 'Do 10 Jumping Jacks',
      description: 'Get active with 10 jumping jacks',
      instructions: 'Stand up, do 10 complete jumping jacks with good form',
      category: MissionCategory.PHYSICAL,
      xpReward: 10,
      coinReward: 5,
      createdById: parentUser.parentProfile!.id,
    },
  });

  // Assign missions to Alex
  await prisma.missionAssignment.create({
    data: {
      missionId: mission1.id,
      childProfileId: child1User.childProfile!.id,
      status: AssignmentStatus.PENDING,
    },
  });

  await prisma.missionAssignment.create({
    data: {
      missionId: mission2.id,
      childProfileId: child1User.childProfile!.id,
      status: AssignmentStatus.PENDING,
    },
  });

  // Assign mission to Emma
  await prisma.missionAssignment.create({
    data: {
      missionId: mission3.id,
      childProfileId: child2User.childProfile!.id,
      status: AssignmentStatus.PENDING,
    },
  });

  // Create rewards
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

  await prisma.reward.create({
    data: {
      familyId: family.id,
      name: 'Extra Screen Time',
      description: '30 minutes of extra screen time',
      conditionType: 'MISSION_COUNT',
      conditionValue: 5,
      isRealWorld: true,
      rewardDetails: '30 extra minutes of tablet or TV time',
    },
  });

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

  // Unlock the first mini-game for Alex
  const tapCollector = await prisma.miniGame.findUnique({
    where: { slug: 'tap-collector' },
  });

  if (tapCollector) {
    await prisma.miniGameUnlock.create({
      data: {
        childProfileId: child1User.childProfile!.id,
        miniGameId: tapCollector.id,
        timesPlayed: 3,
        highScore: 42,
      },
    });
  }

  // Give Alex an achievement
  const firstStepAchievement = await prisma.achievement.findUnique({
    where: { slug: 'first-step' },
  });

  if (firstStepAchievement) {
    await prisma.childAchievement.create({
      data: {
        childProfileId: child1User.childProfile!.id,
        achievementId: firstStepAchievement.id,
        isComplete: true,
      },
    });
  }

  // Enable mission profiles for children
  const dailyLifeTheme = await prisma.missionProfileTheme.findUnique({
    where: { slug: 'daily-life' },
  });

  const fitnessTheme = await prisma.missionProfileTheme.findUnique({
    where: { slug: 'fitness-movement' },
  });

  if (dailyLifeTheme) {
    await prisma.childProfileTheme.create({
      data: {
        childProfileId: child1User.childProfile!.id,
        themeId: dailyLifeTheme.id,
      },
    });
    await prisma.childProfileTheme.create({
      data: {
        childProfileId: child2User.childProfile!.id,
        themeId: dailyLifeTheme.id,
      },
    });
  }

  if (fitnessTheme) {
    await prisma.childProfileTheme.create({
      data: {
        childProfileId: child1User.childProfile!.id,
        themeId: fitnessTheme.id,
      },
    });
  }

  console.log('   ✓ Created demo family with 1 parent and 2 children');
  console.log('   ✓ Created sample missions, rewards, and progression data');
}
