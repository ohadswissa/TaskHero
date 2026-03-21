import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config
import { configValidationSchema } from './config/config.schema';

// Database
import { DatabaseModule } from './database/database.module';

// Core Modules
import { AuthModule } from './modules/auth/auth.module';
import { FamiliesModule } from './modules/families/families.module';
import { UsersModule } from './modules/users/users.module';
import { ChildrenModule } from './modules/children/children.module';

// Mission Modules
import { MissionProfilesModule } from './modules/mission-profiles/mission-profiles.module';
import { MissionTemplatesModule } from './modules/mission-templates/mission-templates.module';
import { MissionsModule } from './modules/missions/missions.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';

// Progression Modules
import { HeroesModule } from './modules/heroes/heroes.module';
import { ProgressionModule } from './modules/progression/progression.module';
import { AchievementsModule } from './modules/achievements/achievements.module';

// Reward Modules
import { RewardsModule } from './modules/rewards/rewards.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MiniGamesModule } from './modules/mini-games/mini-games.module';

// Support Modules
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';

// Guards
// JwtAuthGuard will be used when enabling auth globally
// import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

// Health check
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    DatabaseModule,

    // Health
    HealthModule,

    // Core
    AuthModule,
    FamiliesModule,
    UsersModule,
    ChildrenModule,

    // Missions
    MissionProfilesModule,
    MissionTemplatesModule,
    MissionsModule,
    AssignmentsModule,
    SubmissionsModule,
    ApprovalsModule,

    // Progression
    HeroesModule,
    ProgressionModule,
    AchievementsModule,

    // Rewards
    RewardsModule,
    InventoryModule,
    MiniGamesModule,

    // Support
    NotificationsModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
