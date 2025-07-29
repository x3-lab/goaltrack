import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting } from '../database/entities/settings.entity';
import { User } from '../database/entities/user.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Setting, User, ActivityLog])],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService]
})
export class SettingsModule {}
