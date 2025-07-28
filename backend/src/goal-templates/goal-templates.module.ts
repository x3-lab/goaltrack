import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalTemplatesService } from './goal-templates.service';
import { GoalTemplatesController } from './goal-templates.controller';
import { GoalTemplate } from '../database/entities/goal-template.entity';
import { User } from '../database/entities/user.entity';
import { Goal } from '../database/entities/goal.entity';
import { GoalsModule } from '../goals/goals.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GoalTemplate, User, Goal]),
        GoalsModule
    ],
    controllers: [GoalTemplatesController],
    providers: [GoalTemplatesService],
    exports: [GoalTemplatesService]
})
export class GoalTemplatesModule {}