import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
