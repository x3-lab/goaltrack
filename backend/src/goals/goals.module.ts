import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from 'src/database/entities';
import { User } from 'src/database/entities';
import { ProgressHistory } from 'src/database/entities';
import { ActivityLog } from 'src/database/entities';
import { GoalTemplate } from 'src/database/entities';
import { ProgressHistoryService } from '../progress-history/progress-history.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, User, ProgressHistory, ActivityLog, GoalTemplate])
  ],
  providers: [GoalsService, ProgressHistoryService],
  controllers: [GoalsController],
  exports: [GoalsService],
})
export class GoalsModule {}
