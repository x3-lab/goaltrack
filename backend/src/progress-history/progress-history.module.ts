import { Module } from '@nestjs/common';
import { ProgressHistoryService } from './progress-history.service';
import { ProgressHistoryController } from './progress-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { Goal } from '../database/entities/goal.entity';
import { User } from '../database/entities/user.entity';
import { ActivityLog } from 'src/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressHistory, Goal, User, ActivityLog])],
  providers: [ProgressHistoryService],
  controllers: [ProgressHistoryController],
  exports: [ProgressHistoryService]
})
export class ProgressHistoryModule {}
