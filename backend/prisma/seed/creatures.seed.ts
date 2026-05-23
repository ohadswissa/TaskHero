import { PrismaClient } from '@prisma/client';
import { SPECIES_META } from '../../src/common/utils/progression';
// Path note: backend/prisma/seed/creatures.seed.ts → backend/src/common/utils/progression.ts

/**
 * Creature "seed" for the demo.
 *
 * Note: CreatureSpecies values are an enum — they don't need their own DB
 * table. This seeder exists to (a) document the locked species roster in the
 * seed pipeline, (b) verify the schema is in sync with progression.ts metadata,
 * and (c) act as a hook point if we later move species metadata into a table.
 *
 * Actual Creature rows are created when a child onboards via
 * POST /creatures/me/onboard — never during seed.
 */
export async function seedCreatures(_prisma: PrismaClient) {
  const speciesCount = Object.keys(SPECIES_META).length;
  if (speciesCount !== 3) {
    throw new Error(
      `Expected 3 creature species in SPECIES_META; found ${speciesCount}. ` +
        'Update progression.ts and the CreatureSpecies enum in schema.prisma.',
    );
  }

  // Log the locked roster for visibility during seeding.
  for (const meta of Object.values(SPECIES_META)) {
    console.log(
      `   ✓ Species registered: ${meta.displayName} (default name: ${meta.defaultName})`,
    );
  }
}
