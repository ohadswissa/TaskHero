import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

(async () => {
  const family = await p.family.findUnique({ where: { inviteCode: 'DEMO2024' } });
  if (!family) {
    console.log('no demo family — run npm run seed first');
    process.exit(0);
  }
  const child = await p.childProfile.findFirst({
    where: { user: { familyId: family.id } },
  });
  if (!child) {
    console.log('no child');
    process.exit(0);
  }
  const creature = await p.creature.findFirst({ where: { childProfileId: child.id } });
  if (!creature) {
    console.log('no creature');
    process.exit(0);
  }

  const extras = [
    { itemSlug: 'honey_drop', traitCategory: 'HEART', happinessDelta: 9 },
    { itemSlug: 'star_fruit', traitCategory: 'WISDOM', happinessDelta: 11 },
    { itemSlug: 'cloud_cake', traitCategory: 'HEART', happinessDelta: 12 },
    { itemSlug: 'ember_pepper', traitCategory: 'STRENGTH', happinessDelta: 9 },
    { itemSlug: 'rainbow_jelly', traitCategory: 'HEART', happinessDelta: 10 },
    { itemSlug: 'mint_leaf', traitCategory: 'WISDOM', happinessDelta: 8 },
    { itemSlug: 'sparkle_seed', traitCategory: 'STRENGTH', happinessDelta: 11 },
    { itemSlug: 'sunberry', traitCategory: 'STRENGTH', happinessDelta: 10 },
    { itemSlug: 'moon_petal', traitCategory: 'WISDOM', happinessDelta: 10 },
    { itemSlug: 'heart_root', traitCategory: 'HEART', happinessDelta: 10 },
  ];

  let added = 0;
  for (const it of extras) {
    await p.careItem.create({
      data: {
        creatureId: creature.id,
        itemSlug: it.itemSlug,
        traitCategory: it.traitCategory as 'STRENGTH' | 'WISDOM' | 'HEART',
        happinessDelta: it.happinessDelta,
        traitPointDelta: 1,
      },
    });
    added++;
  }

  const total = await p.careItem.count({
    where: { creatureId: creature.id, consumedAt: null },
  });
  console.log(`added ${added}, pending now: ${total}`);
  await p.$disconnect();
})();
