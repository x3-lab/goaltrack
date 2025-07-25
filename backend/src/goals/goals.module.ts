import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from 'src/database/entities';
import { User } from 'src/database/entities';
import { ProgressHistory } from 'src/database/entities';
import { ActivityLog } from 'src/database/entities';


@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, User, ProgressHistory, ActivityLog])
  ],
  providers: [GoalsService],
  controllers: [GoalsController],
  exports: [GoalsService],
})
export class GoalsModule {}
