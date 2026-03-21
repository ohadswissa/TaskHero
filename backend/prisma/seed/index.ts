import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedThemes } from './themes.seed';
import { seedTemplates } from './templates.seed';
import { seedAchievements } from './achievements.seed';
import { seedMiniGames } from './mini-games.seed';
import { seedItems } from './items.seed';
import { seedDemoFamily } from './demo-family.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed global data
  console.log('📚 Seeding mission profile themes...');
  await seedThemes(prisma);
  
  console.log('📝 Seeding mission templates...');
  await seedTemplates(prisma);
  
  console.log('🏆 Seeding achievements...');
  await seedAchievements(prisma);
  
  console.log('🎮 Seeding mini-games...');
  await seedMiniGames(prisma);
  
  console.log('🎁 Seeding inventory items...');
  await seedItems(prisma);
  
  // Seed demo data
  console.log('\n👨‍👩‍👧‍👦 Seeding demo family...');
  await seedDemoFamily(prisma);

  console.log('\n✅ Database seeding completed!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Parent: demo@taskhero.app / Demo123!');
  console.log('   Child: Family Code: DEMO2024, PIN: 1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
