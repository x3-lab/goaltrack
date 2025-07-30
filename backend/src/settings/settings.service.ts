import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Setting } from '../database/entities/settings.entity';
import { SettingScope, SettingType } from '../database/enums/settings.enums'
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user.enums';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';


@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) {}

    async onModuleInit() {
        await this.initializeDefaultSettings();
    }

    async findAll(
        scope?: SettingScope,
        userId?: string,
        currentUser?: User
    ): Promise<SettingResponseDto[]> {
        const queryBuilder = this.settingRepository
            .createQueryBuilder('setting')
            .leftJoinAndSelect('setting.updatedBy', 'updatedBy')
            .orderBy('setting.key', 'ASC');

        if (scope) {
            queryBuilder.andWhere('setting.scope = :scope', { scope });
        }

        if (userId) {
            queryBuilder.andWhere('setting.userId = :userId', { userId });
        } else if (scope === SettingScope.USER) {
            queryBuilder.andWhere('setting.userId IS NULL');
        }

        if (currentUser?.role !== UserRole.ADMIN) {
            queryBuilder.andWhere(
                '(setting.scope = :userScope AND setting.userId = :currentUserId) OR ' +
                '(setting.scope = :systemScope AND setting.sensitive = false)',
                {
                    userScope: SettingScope.USER,
                    currentUserId: currentUser?.id,
                    systemScope: SettingScope.SYSTEM
                }
            );
        }

        const settings = await queryBuilder.getMany();
        return settings.map(setting => new SettingResponseDto(setting));
    }

    async findByKey(
        key: string,
        scope: SettingScope = SettingScope.SYSTEM,
        userId?: string
    ): Promise<SettingResponseDto> {
        const where: any = { key, scope };
        if (userId) {
            where.userId = userId;
        }

        const setting = await this.settingRepository.findOne({
            where,
            relations: ['updatedBy']
        });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        return new SettingResponseDto(setting);
    }

    async create(
        createSettingDto: CreateSettingDto,
        currentUser: User
    ): Promise<SettingResponseDto> {
        if ((createSettingDto.scope === SettingScope.SYSTEM || 
             createSettingDto.scope === SettingScope.ORGANIZATION) &&
            currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can create system/organization settings');
        }

        const whereClause: any = {
            key: createSettingDto.key,
            scope: createSettingDto.scope
        };
        
        if (createSettingDto.userId) {
            whereClause.userId = createSettingDto.userId;
        } else {
            whereClause.userId = IsNull();
        }
        
        const existing = await this.settingRepository.findOne({
            where: whereClause
        });

        if (existing) {
            throw new BadRequestException('Setting with this key already exists');
        }

        this.validateSettingValue(createSettingDto.value, createSettingDto.type);

        const setting = this.settingRepository.create({
            ...createSettingDto,
            updatedById: currentUser.id
        });

        const savedSetting = await this.settingRepository.save(setting);

        await this.logActivity(
            currentUser.id,
            'CREATE_SETTING',
            'setting',
            savedSetting.id,
            { key: savedSetting.key, scope: savedSetting.scope }
        );

        const settingWithRelations = await this.settingRepository.findOne({
            where: { id: savedSetting.id },
            relations: ['updatedBy']
        });

        if (!settingWithRelations) {
            throw new NotFoundException(`Setting with id '${savedSetting.id}' not found`);
        }

        return new SettingResponseDto(settingWithRelations);
    }

    async update(
        key: string,
        updateSettingDto: UpdateSettingDto,
        scope: SettingScope = SettingScope.SYSTEM,
        userId: string | undefined,
        currentUser: User
    ): Promise<SettingResponseDto> {
        const where: any = { key, scope };
        if (userId) {
            where.userId = userId;
        }

        const setting = await this.settingRepository.findOne({
            where,
            relations: ['updatedBy']
        });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        if (!setting.editable) {
            throw new ForbiddenException('This setting is not editable');
        }

        if ((setting.scope === SettingScope.SYSTEM || 
             setting.scope === SettingScope.ORGANIZATION) &&
            currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can update system/organization settings');
        }

        if (setting.scope === SettingScope.USER && 
            setting.userId !== currentUser.id &&
            currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only update your own user settings');
        }

        // Validate value if provided
        if (updateSettingDto.value !== undefined) {
            this.validateSettingValue(updateSettingDto.value, updateSettingDto.type || setting.type);
        }

        // Validate allowed values
        if (setting.allowedValues && updateSettingDto.value) {
            if (!setting.allowedValues.includes(updateSettingDto.value)) {
                throw new BadRequestException(
                    `Value must be one of: ${setting.allowedValues.join(', ')}`
                );
            }
        }

        Object.assign(setting, updateSettingDto);
        setting.updatedById = currentUser.id;

        const updatedSetting = await this.settingRepository.save(setting);

        await this.logActivity(
            currentUser.id,
            'UPDATE_SETTING',
            'setting',
            updatedSetting.id,
            { key: updatedSetting.key, changes: updateSettingDto }
        );

        return new SettingResponseDto(updatedSetting);
    }

    async bulkUpdate(
        bulkUpdateDto: BulkUpdateSettingsDto,
        scope: SettingScope = SettingScope.SYSTEM,
        userId: string | undefined,
        currentUser: User
    ): Promise<SettingResponseDto[]> {
        const results: SettingResponseDto[] = [];

        for (const settingUpdate of bulkUpdateDto.settings) {
            try {
                const result = await this.update(
                    settingUpdate.key,
                    { value: settingUpdate.value },
                    scope,
                    userId,
                    currentUser
                );
                results.push(result);
            } catch (error) {
                // Log error but continue with other settings
                console.error(`Failed to update setting ${settingUpdate.key}:`, error);
            }
        }

        return results;
    }

    async remove(
        key: string,
        scope: SettingScope = SettingScope.SYSTEM,
        userId: string | undefined,
        currentUser: User
    ): Promise<void> {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can delete settings');
        }

        const where: any = { key, scope };
        if (userId) {
            where.userId = userId;
        }

        const setting = await this.settingRepository.findOne({ where });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        await this.settingRepository.remove(setting);

        await this.logActivity(
            currentUser.id,
            'DELETE_SETTING',
            'setting',
            setting.id,
            { key: setting.key, scope: setting.scope }
        );
    }

    async getSystemConfig(): Promise<{ [key: string]: any }> {
        const settings = await this.settingRepository.find({
            where: { scope: SettingScope.SYSTEM, sensitive: false },
            order: { key: 'ASC' }
        });

        const config: { [key: string]: any } = {};
        for (const setting of settings) {
            config[setting.key] = this.parseValue(setting.value, setting.type);
        }

        return config;
    }

    async getUserPreferences(userId: string): Promise<{ [key: string]: any }> {
        const settings = await this.settingRepository.find({
            where: { scope: SettingScope.USER, userId },
            order: { key: 'ASC' }
        });

        const preferences: { [key: string]: any } = {};
        for (const setting of settings) {
            preferences[setting.key] = this.parseValue(setting.value, setting.type);
        }

        return preferences;
    }

    async exportSettings(scope?: SettingScope): Promise<any> {
        const queryBuilder = this.settingRepository
            .createQueryBuilder('setting')
            .leftJoinAndSelect('setting.updatedBy', 'updatedBy')
            .orderBy('setting.key', 'ASC');

        if (scope) {
            queryBuilder.andWhere('setting.scope = :scope', { scope });
        }

        // Exclude sensitive settings from export
        queryBuilder.andWhere('setting.sensitive = false');

        const settings = await queryBuilder.getMany();

        return {
            exportDate: new Date().toISOString(),
            scope: scope || 'all',
            settings: settings.map(setting => ({
                key: setting.key,
                value: setting.value,
                type: setting.type,
                scope: setting.scope,
                description: setting.description,
                editable: setting.editable,
                allowedValues: setting.allowedValues,
                userId: setting.userId
            }))
        };
    }

    private async initializeDefaultSettings(): Promise<void> {
        const defaultSettings = [
            // System Settings
            {
                key: 'organization.name',
                value: 'X3 Lab',
                type: SettingType.STRING,
                scope: SettingScope.SYSTEM,
                description: 'Organization name displayed throughout the application',
                editable: true
            },
            {
                key: 'goals.max_per_week',
                value: '5',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'Maximum number of goals a volunteer can create per week',
                editable: true
            },
            {
                key: 'goals.default_duration_days',
                value: '7',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'Default duration for new goals in days',
                editable: true
            },
            {
                key: 'notifications.email_enabled',
                value: 'true',
                type: SettingType.BOOLEAN,
                scope: SettingScope.SYSTEM,
                description: 'Enable email notifications system-wide',
                editable: true
            },
            {
                key: 'notifications.reminder_days_before',
                value: '3',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'Days before deadline to send reminder notifications',
                editable: true
            },
            {
                key: 'data.retention_months',
                value: '12',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'Number of months to retain goal and progress data',
                editable: true
            },
            {
                key: 'backup.frequency_hours',
                value: '24',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'Backup frequency in hours',
                editable: true
            },
            {
                key: 'security.session_timeout_minutes',
                value: '60',
                type: SettingType.NUMBER,
                scope: SettingScope.SYSTEM,
                description: 'User session timeout in minutes',
                editable: true
            },
            {
                key: 'features.analytics_enabled',
                value: 'true',
                type: SettingType.BOOLEAN,
                scope: SettingScope.SYSTEM,
                description: 'Enable analytics and reporting features',
                editable: true
            },
            {
                key: 'features.goal_templates_enabled',
                value: 'true',
                type: SettingType.BOOLEAN,
                scope: SettingScope.SYSTEM,
                description: 'Enable goal templates feature',
                editable: true
            },
            // User Settings Templates (these will be copied for each user)
            {
                key: 'user.theme',
                value: 'light',
                type: SettingType.STRING,
                scope: SettingScope.USER,
                description: 'User interface theme preference',
                editable: true,
                allowedValues: ['light', 'dark', 'auto']
            },
            {
                key: 'user.timezone',
                value: 'America/New_York',
                type: SettingType.STRING,
                scope: SettingScope.USER,
                description: 'User timezone preference',
                editable: true
            },
            {
                key: 'user.email_notifications',
                value: 'true',
                type: SettingType.BOOLEAN,
                scope: SettingScope.USER,
                description: 'Receive email notifications',
                editable: true
            },
            {
                key: 'user.weekly_reports',
                value: 'true',
                type: SettingType.BOOLEAN,
                scope: SettingScope.USER,
                description: 'Receive weekly progress reports',
                editable: true
            }
        ];

        for (const settingData of defaultSettings) {
            const existing = await this.settingRepository.findOne({
                where: {
                    key: settingData.key,
                    scope: settingData.scope,
                    userId: IsNull()
                }
            });

            if (!existing) {
                const setting = this.settingRepository.create(settingData);
                await this.settingRepository.save(setting);
            }
        }
    }

    private validateSettingValue(value: string, type: SettingType): void {
        try {
            switch (type) {
                case SettingType.BOOLEAN:
                    if (!['true', 'false'].includes(value.toLowerCase())) {
                        throw new BadRequestException('Boolean value must be "true" or "false"');
                    }
                    break;
                case SettingType.NUMBER:
                    if (isNaN(Number(value))) {
                        throw new BadRequestException('Value must be a valid number');
                    }
                    break;
                case SettingType.JSON:
                case SettingType.ARRAY:
                    JSON.parse(value);
                    break;
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Invalid ${type} value`);
        }
    }

    private parseValue(value: string, type: SettingType): any {
        try {
            switch (type) {
                case SettingType.BOOLEAN:
                    return value === 'true';
                case SettingType.NUMBER:
                    return Number(value);
                case SettingType.JSON:
                case SettingType.ARRAY:
                    return JSON.parse(value);
                default:
                    return value;
            }
        } catch {
            return value;
        }
    }

    private async logActivity(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        details: any
    ): Promise<void> {
        const log = this.activityLogRepository.create({
            userId,
            action,
            resource,
            resourceId,
            details,
            createdAt: new Date()
        });

        await this.activityLogRepository.save(log);
    }
}
