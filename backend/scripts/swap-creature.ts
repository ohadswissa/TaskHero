import { PrismaClient, CreatureSpecies } from '@prisma/client';

const p = new PrismaClient();

(async () => {
  const family = await p.family.findUnique({ where: { inviteCode: 'DEMO2024' } });
  if (!family) {
    console.log('no demo family');
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

  // Pick the species that is NOT the current one — cycle FOREST_PUP → SKY_SPRITE → STONE_CUB → FOREST_PUP
  const order: CreatureSpecies[] = [
    CreatureSpecies.FOREST_PUP,
    CreatureSpecies.SKY_SPRITE,
    CreatureSpecies.STONE_CUB,
  ];
  const idx = order.indexOf(creature.species);
  const next = order[(idx + 1) % order.length];

  // Give the new species a fresh themed name
  const nameMap: Record<CreatureSpecies, string> = {
    FOREST_PUP: 'Sprout',
    SKY_SPRITE: 'Nimbus',
    STONE_CUB: 'Boulder',
  };

  const updated = await p.creature.update({
    where: { id: creature.id },
    data: {
      species: next,
      name: nameMap[next],
    },
  });

  console.log(`✓ swapped Liam's creature: ${creature.species} (${creature.name}) → ${updated.species} (${updated.name})`);
  await p.$disconnect();
})();
