import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
    Post,
    Body,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SystemOverviewDto } from './dto/system-overview.dto';
import { PersonalAnalyticsDto } from './dto/personal-analytics.dto';
import { AnalyticsDataDto } from './dto/analytics-data.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { VolunteerPerformanceDto } from './dto/volunteer-performance.dto';
import { AnalyticsFiltersDto, PersonalAnalyticsFiltersDto } from './dto/analytics-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/enums/user.enums';
import { User } from '../database/entities/user.entity';


@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('system-overview')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getSystemOverview(
        @Query(ValidationPipe) filters?: AnalyticsFiltersDto,
    ): Promise<SystemOverviewDto> {
        return this.analyticsService.getSystemOverview(filters);
    }

    @Get('personal/:volunteerId')
    async getPersonalAnalytics(
        @Query(ValidationPipe) filters: PersonalAnalyticsFiltersDto,
        @CurrentUser() currentUser: User,
    ): Promise<PersonalAnalyticsDto> {
        return this.analyticsService.getPersonalAnalytics(filters, currentUser);
    }

    @Get('completion-trends')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getCompletionTrends(
        @Query(ValidationPipe) filters?: AnalyticsFiltersDto,
    ): Promise<AnalyticsDataDto['completionTrends']> {
        const data = await this.analyticsService.getAnalyticsData(filters || {});
        return data.completionTrends;
    }

    @Get('performance-distribution')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getPerformanceDistribution(): Promise<AnalyticsDataDto['performanceDistribution']> {
        const data = await this.analyticsService.getAnalyticsData({});
        return data.performanceDistribution;
    }

    @Get('category-breakdown')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getCategoryBreakdown(
        @Query(ValidationPipe) filters?: AnalyticsFiltersDto,
    ): Promise<AnalyticsDataDto['categoryBreakdown']> {
        const data = await this.analyticsService.getAnalyticsData(filters || {});
        return data.categoryBreakdown;
    }

    @Get('volunteer-activity')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getVolunteerActivity(
        @Query(ValidationPipe) filters?: AnalyticsFiltersDto,
    ): Promise<AnalyticsDataDto['volunteerActivity']> {
        const data = await this.analyticsService.getAnalyticsData(filters || {});
        return data.volunteerActivity;
    }

    @Get('data')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAnalyticsData(
        @Query(ValidationPipe) filters?: AnalyticsFiltersDto,
    ): Promise<AnalyticsDataDto> {
        return this.analyticsService.getAnalyticsData(filters || {});
    }

    @Get('volunteer-performance')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getVolunteerPerformance(): Promise<VolunteerPerformanceDto[]> {
        return this.analyticsService.getVolunteerPerformance();
    }
    
    @Post('export')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async exportReport(
        @Body() request: { type: 'overview' | 'performance' | 'goals'; filters?: AnalyticsFiltersDto },
    ): Promise<ExportReportDto> {
        return this.analyticsService.exportReport(request.type, request.filters);
    }
}