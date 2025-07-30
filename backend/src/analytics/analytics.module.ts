import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Goal } from '../database/entities/goal.entity';
import { User } from '../database/entities/user.entity';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Goal, User, ProgressHistory, ActivityLog])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}