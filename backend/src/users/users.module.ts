import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { Goal } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ActivityLog, Goal]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
