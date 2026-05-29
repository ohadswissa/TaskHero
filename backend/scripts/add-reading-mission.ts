/**
 * One-shot: add the "Spend 15 min reading" mission as a PENDING assignment
 * for Liam in the DEMO2024 family. Skips cleanly if already active.
 *
 * Run: cd backend && npx tsx scripts/add-reading-mission.ts
 */
import { PrismaClient, AssignmentStatus } from '@prisma/client';

const p = new PrismaClient();
const TITLE = 'Spend 15 min reading';

(async () => {
  const family = await p.family.findUnique({ where: { inviteCode: 'DEMO2024' } });
  if (!family) {
    console.log('no demo family — run npm run seed first');
    process.exit(0);
  }

  const child = await p.childProfile.findFirst({
    where: { user: { familyId: family.id } },
    include: { user: true },
  });
  if (!child) {
    console.log('no child');
    process.exit(0);
  }

  // Look for an existing active assignment for this child with this title
  const existing = await p.missionAssignment.findFirst({
    where: {
      childProfileId: child.id,
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] },
      mission: { title: TITLE },
    },
  });

  if (existing) {
    console.log(`already active for Liam (assignment ${existing.id}, status=${existing.status}) — skipping`);
    await p.$disconnect();
    return;
  }

  const template = await p.missionTemplate.findFirst({ where: { title: TITLE } });
  if (!template) {
    console.log(`template "${TITLE}" not found — run npm run seed first`);
    process.exit(0);
  }

  // Find a parent profile in the same family to author the mission
  const parent = await p.parentProfile.findFirst({
    where: { user: { familyId: family.id } },
  });
  if (!parent) {
    console.log('no parent profile in family');
    process.exit(0);
  }

  const mission = await p.mission.create({
    data: {
      title: template.title,
      description: template.description,
      instructions: template.instructions,
      category: template.category,
      traitCategory: template.traitCategory,
      heroWisdom: template.heroWisdom,
      xpReward: template.suggestedXp,
      coinReward: template.suggestedCoins,
      createdById: parent.id,
      templateId: template.id,
    },
  });

  const assignment = await p.missionAssignment.create({
    data: {
      missionId: mission.id,
      childProfileId: child.id,
      status: AssignmentStatus.PENDING,
    },
  });

  console.log(`✓ added "${TITLE}" as PENDING assignment ${assignment.id} for ${child.displayName}`);
  await p.$disconnect();
})();
