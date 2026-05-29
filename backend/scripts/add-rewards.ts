/**
 * One-shot: add two extra family rewards to DEMO2024 that are immediately
 * redeemable by Liam (coins=120, streak=6). Skips if already present by name.
 *
 * Run: cd backend && npx tsx scripts/add-rewards.ts
 */
import { PrismaClient, RewardStatus, UnlockConditionType } from '@prisma/client';

const p = new PrismaClient();

const REWARDS = [
  {
    name: 'Choose dinner tomorrow',
    description: 'Pick what the family eats for dinner tomorrow night.',
    conditionType: UnlockConditionType.COIN_THRESHOLD,
    conditionValue: 30,
    rewardDetails: 'Your dinner pick — within reason!',
  },
  {
    name: 'Stay up 30 min late',
    description: 'Bonus bedtime — stay up 30 minutes past your usual time.',
    conditionType: UnlockConditionType.STREAK_DAYS,
    conditionValue: 5,
    rewardDetails: 'One bonus night, 30 minutes past lights-out.',
  },
];

(async () => {
  const family = await p.family.findUnique({ where: { inviteCode: 'DEMO2024' } });
  if (!family) {
    console.log('no demo family — run npm run seed first');
    process.exit(0);
  }

  let added = 0;
  let skipped = 0;
  for (const r of REWARDS) {
    const existing = await p.reward.findFirst({
      where: { familyId: family.id, name: r.name },
    });
    if (existing) {
      console.log(`- "${r.name}" already exists — skipping`);
      skipped++;
      continue;
    }
    await p.reward.create({
      data: {
        familyId: family.id,
        name: r.name,
        description: r.description,
        conditionType: r.conditionType,
        conditionValue: r.conditionValue,
        isRealWorld: true,
        rewardDetails: r.rewardDetails,
        status: RewardStatus.ACTIVE,
      },
    });
    console.log(`✓ added "${r.name}" (${r.conditionType} ${r.conditionValue})`);
    added++;
  }

  console.log(`done: ${added} added, ${skipped} skipped`);
  await p.$disconnect();
})();
