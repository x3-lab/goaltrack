import { 
    Controller, 
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
    ParseIntPipe 
} from '@nestjs/common';
import { ProgressHistoryService } from './progress-history.service';
import { CreateProgressHistoryDto } from './dto/create-progress-history.dto';
import { ProgressHistoryResponseDto } from './dto/progress-history-response.dto';
import { ProgressHistoryFiltersDto } from './dto/progress-history-filters.dto';
import { VolunteerTrendsDto } from './dto/volunteer-trends.dto';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';
import { AnalyticsSummaryDto, VolunteerWeeklyHistoryDto, MostProductiveDayDto } from './dto/analytics-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/enums/user.enums';
import { User } from '../database/entities/user.entity';

@Controller('progress-history')
@UseGuards(JwtAuthGuard)
export class ProgressHistoryController {
    constructor(private readonly progressHistoryService: ProgressHistoryService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(
        @Body(ValidationPipe) createProgressHistoryDto: CreateProgressHistoryDto,
        @CurrentUser() currentUser: User,
    ): Promise<ProgressHistoryResponseDto> {
        return this.progressHistoryService.create(createProgressHistoryDto, currentUser);
    }

    @Get()
    async findAll(
        @Query(ValidationPipe) filters: ProgressHistoryFiltersDto,
        @CurrentUser() currentUser: User,
    ): Promise<{
        progressHistory: ProgressHistoryResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return this.progressHistoryService.findAll(filters, currentUser);
    }

    @Get('analytics/summary')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
        return this.progressHistoryService.getAnalyticsSummary();
    }

    @Get('volunteer/:volunteerId/trends')
    async getVolunteerTrends(
        @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
        @CurrentUser() currentUser: User,
    ): Promise<VolunteerTrendsDto> {
        return this.progressHistoryService.getVolunteerTrends(volunteerId, currentUser);
    }

    @Get('monthly/:year/:month')
    async getMonthlySummary(
        @Param('year', ParseIntPipe) year: number,
        @Param('month', ParseIntPipe) month: number,
        @Query('volunteerId') volunteerId: string,
        @CurrentUser() currentUser: User,
    ): Promise<MonthlySummaryDto> {
        return this.progressHistoryService.getMonthlySummary(month, year, volunteerId, currentUser);
    }

    @Get('volunteer/:volunteerId/monthly/:year/:month')
    async getVolunteerMonthlySummary(
        @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
        @Param('year', ParseIntPipe) year: number,
        @Param('month', ParseIntPipe) month: number,
        @CurrentUser() currentUser: User,
    ): Promise<MonthlySummaryDto> {
        return this.progressHistoryService.getMonthlySummary(month, year, volunteerId, currentUser);
    }

    @Get('my-history')
    async getMyHistory(
        @Query(ValidationPipe) filters: ProgressHistoryFiltersDto,
        @CurrentUser() currentUser: User,
    ): Promise<{
        progressHistory: ProgressHistoryResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        filters.volunteerId = currentUser.id;
        return this.progressHistoryService.findAll(filters, currentUser);
    }

    @Get('my-trends')
    async getMyTrends(@CurrentUser() currentUser: User): Promise<VolunteerTrendsDto> {
        return this.progressHistoryService.getVolunteerTrends(currentUser.id, currentUser);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<ProgressHistoryResponseDto> {
        return this.progressHistoryService.findOne(id, currentUser);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<void> {
        return this.progressHistoryService.remove(id, currentUser);
    }

    @Get('volunteer/:volunteerId/weekly-history')
    async getVolunteerWeeklyHistory(
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() currentUser: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    ): Promise<VolunteerWeeklyHistoryDto> {
    return this.progressHistoryService.getVolunteerWeeklyHistory(
        volunteerId,
        currentUser,
        startDate,
        endDate,
    );
    }

    @Get('my-weekly-history')
    async getMyWeeklyHistory(
    @CurrentUser() currentUser: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    ): Promise<VolunteerWeeklyHistoryDto> {
    return this.progressHistoryService.getVolunteerWeeklyHistory(
        currentUser.id,
        currentUser,
        startDate,
        endDate,
    );
    }

    @Get('volunteer/:volunteerId/productive-day')
    async getVolunteerMostProductiveDay(
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() currentUser: User,
    ): Promise<MostProductiveDayDto> {
        return this.progressHistoryService.getVolunteerMostProductiveDay(volunteerId, currentUser);
    }

    @Get('my-productive-day')
    async getMyMostProductiveDay(
    @CurrentUser() currentUser: User,
    ): Promise<MostProductiveDayDto> {
        return this.progressHistoryService.getVolunteerMostProductiveDay(currentUser.id, currentUser);
    }
}
