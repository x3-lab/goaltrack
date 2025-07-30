import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ValidationPipe,
    HttpCode,
    HttpStatus,
    ParseEnumPipe
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { SettingScope } from '../database/enums/settings.enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user.enums';


@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    async findAll(
        @Query('scope', new ParseEnumPipe(SettingScope, { optional: true })) scope?: SettingScope,
        @Query('userId') userId?: string,
        @CurrentUser() currentUser?: User
    ) {
        return this.settingsService.findAll(scope, userId, currentUser);
    }

    @Get('system/config')
    async getSystemConfig() {
        return this.settingsService.getSystemConfig();
    }

    @Get('user/:userId/preferences')
    async getUserPreferences(
        @Param('userId') userId: string,
        @CurrentUser() currentUser: User
    ) {
        // Users can only access their own preferences unless they're admin
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== userId) {
            userId = currentUser.id;
        }
        return this.settingsService.getUserPreferences(userId);
    }

    @Get('export')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async exportSettings(
        @Query('scope', new ParseEnumPipe(SettingScope, { optional: true })) scope?: SettingScope
    ) {
        return this.settingsService.exportSettings(scope);
    }

    @Get(':scope/:key')
    async findByKey(
        @Param('key') key: string,
        @Param('scope', new ParseEnumPipe(SettingScope)) scope: SettingScope,
        @Query('userId') userId?: string
    ) {
        return this.settingsService.findByKey(key, scope, userId);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(
        @Body(ValidationPipe) createSettingDto: CreateSettingDto,
        @CurrentUser() currentUser: User
    ) {
        return this.settingsService.create(createSettingDto, currentUser);
    }

    @Put('bulk/:scope')
    async bulkUpdate(
        @Param('scope', new ParseEnumPipe(SettingScope)) scope: SettingScope,
        @Body(ValidationPipe) bulkUpdateDto: BulkUpdateSettingsDto,
        @CurrentUser() currentUser: User,
        @Query('userId') userId?: string
    ) {
        return this.settingsService.bulkUpdate(bulkUpdateDto, scope, userId, currentUser);
    }

    @Put(':scope/:key')
    async update(
        @Param('key') key: string,
        @Param('scope', new ParseEnumPipe(SettingScope)) scope: SettingScope,
        @Body(ValidationPipe) updateSettingDto: UpdateSettingDto,
        @CurrentUser() currentUser: User,
        @Query('userId') userId?: string
    ) {
        return this.settingsService.update(key, updateSettingDto, scope, userId, currentUser);
    }

    @Delete(':scope/:key')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('key') key: string,
        @Param('scope', new ParseEnumPipe(SettingScope)) scope: SettingScope,
        @CurrentUser() currentUser: User,
        @Query('userId') userId?: string,
    ) {
        await this.settingsService.remove(key, scope, userId, currentUser);
    }
}
