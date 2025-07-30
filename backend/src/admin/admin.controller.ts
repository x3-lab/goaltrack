import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    Query,
    ParseIntPipe,
    ValidationPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminProfileDto, UpdateAdminProfileDto, UpdateAdminPreferencesDto } from './dto/admin-profile.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { ActivityDto, DeadlineDto } from './dto/dashboard-activity.dto';
import { VolunteerWithGoalsDto } from './dto/volunteers-with-goals.dto';
import { ChangeAdminPasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/enums/user.enums';
import { User } from '../database/entities/user.entity';


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('profile')
    async getProfile(@CurrentUser() currentUser: User): Promise<AdminProfileDto> {
        return this.adminService.getProfile(currentUser.id);
    }

    @Patch('profile')
    async updateProfile(
        @CurrentUser() currentUser: User,
        @Body(ValidationPipe) updateData: UpdateAdminProfileDto,
    ): Promise<AdminProfileDto> {
        return this.adminService.updateProfile(currentUser.id, updateData);
    }

    @Patch('preferences')
    async updatePreferences(
        @CurrentUser() currentUser: User,
        @Body(ValidationPipe) preferencesData: UpdateAdminPreferencesDto,
    ): Promise<AdminProfileDto> {
        return this.adminService.updatePreferences(currentUser.id, preferencesData);
    }

    @Post('change-password')
    async changePassword(
        @CurrentUser() currentUser: User,
        @Body(ValidationPipe) changePasswordData: ChangeAdminPasswordDto,
    ): Promise<{ success: boolean }> {
        const success = await this.adminService.changePassword(currentUser.id, changePasswordData);
        return { success };
    }

    @Get('dashboard/stats')
    async getDashboardStats(): Promise<DashboardStatsDto> {
        return this.adminService.getDashboardStats();
    }

    @Get('dashboard/activity')
    async getRecentActivity(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ): Promise<ActivityDto[]> {
        return this.adminService.getRecentActivity(limit);
    }

    @Get('dashboard/deadlines')
    async getUpcomingDeadlines(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ): Promise<DeadlineDto[]> {
        return this.adminService.getUpcomingDeadlines(limit);
    }

    @Get('volunteers-with-goals')
    async getVolunteersWithGoals(): Promise<VolunteerWithGoalsDto[]> {
        return this.adminService.getVolunteersWithGoals();
    }
}