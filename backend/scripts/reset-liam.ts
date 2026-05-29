/**
 * Reset Liam to a zero-state hero so a demo recording can walk the full
 * onboarding flow (origin → species → name → hatch) and earn first
 * missions / first care items from scratch.
 *
 * Safe to re-run any time. Maya (parent) is untouched.
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

(async () => {
  const family = await p.family.findUnique({ where: { inviteCode: 'DEMO2024' } });
  if (!family) {
    console.log('no demo family');
    process.exit(0);
  }
  const child = await p.childProfile.findFirst({
    where: { user: { familyId: family.id } },
    include: { hero: true },
  });
  if (!child) {
    console.log('no child');
    process.exit(0);
  }

  console.log(`Resetting Liam (childProfileId=${child.id})…`);

  // 1. Delete creature (and cascading care items / events).
  // Care items have a creatureId FK so we wipe them explicitly first
  // in case onDelete is not cascade.
  const creature = await p.creature.findFirst({ where: { childProfileId: child.id } });
  if (creature) {
    try {
      await p.careItem.deleteMany({ where: { creatureId: creature.id } });
    } catch {}
    try {
      // Some schemas have a CreatureEvent table — best-effort delete.
      await (p as any).creatureEvent?.deleteMany?.({ where: { creatureId: creature.id } });
    } catch {}
    await p.creature.delete({ where: { id: creature.id } });
    console.log(`  ✓ deleted creature (${creature.species} ${creature.name})`);
  }

  // 2. Delete all mission assignments + their submissions/approvals.
  const assignments = await p.missionAssignment.findMany({
    where: { childProfileId: child.id },
    select: { id: true },
  });
  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length > 0) {
    const submissions = await p.missionSubmission.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { id: true },
    });
    const submissionIds = submissions.map((s) => s.id);
    if (submissionIds.length > 0) {
      await p.missionApproval.deleteMany({
        where: { submissionId: { in: submissionIds } },
      });
      await p.missionSubmission.deleteMany({
        where: { id: { in: submissionIds } },
      });
    }
    await p.missionAssignment.deleteMany({
      where: { id: { in: assignmentIds } },
    });
    console.log(`  ✓ deleted ${assignmentIds.length} assignments + their submissions/approvals`);
  }

  // 3. Reset hero stats to zero (level 1, no xp, no coins, no streak).
  if (child.hero) {
    await p.hero.update({
      where: { id: child.hero.id },
      data: {
        level: 1,
        currentXp: 0,
        totalXp: 0,
        coins: 0,
        totalCoinsEarned: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
      },
    });
    console.log('  ✓ reset hero stats (L1, 0 XP, 0 coins, 0 streak)');
  }

  // 4. Clear all achievements unlocked by this child.
  try {
    const a = await p.childAchievement.deleteMany({ where: { childProfileId: child.id } });
    if (a.count > 0) console.log(`  ✓ cleared ${a.count} child achievements`);
  } catch {}

  // 5. Clear notifications for this child user so HeroMail starts fresh.
  try {
    const n = await p.notification.deleteMany({ where: { userId: child.userId } });
    if (n.count > 0) console.log(`  ✓ cleared ${n.count} notifications`);
  } catch {}

  // 6. Clear redemptions if model exists.
  try {
    const r = await (p as any).rewardRedemption?.deleteMany?.({
      where: { childProfileId: child.id },
    });
    if (r?.count > 0) console.log(`  ✓ cleared ${r.count} reward redemptions`);
  } catch {}

  console.log('\n✅ Liam is reset. Next login will trigger onboarding → origin story.');
  await p.$disconnect();
})();
