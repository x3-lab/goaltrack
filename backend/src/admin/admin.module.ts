// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../database/entities/user.entity';
import { Goal } from '../database/entities/goal.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { ProgressHistory } from '../database/entities/progress-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Goal, ActivityLog, ProgressHistory])],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}