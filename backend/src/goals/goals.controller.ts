import { Controller, 
    Get,
    Post,
    Put,
    Patch,
    Body,
    Delete,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateGoalStatusDto } from './dto/update-goal-status.dto';
import { BulkUpdateGoalsDto } from './dto/bulk-update-goals.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { GoalFilterDto } from './dto/goal-filters.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';
import { WeeklyProcessingResultDto } from './dto/weekly-processing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/enums/user.enums';
import { User } from '../database/entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) {}

    @Post()
    async create(
        @Body(ValidationPipe) createGoalDto: CreateGoalDto,
        @CurrentUser() currentUser: User,
    ): Promise<GoalResponseDto> {
        return this.goalsService.create(createGoalDto, currentUser.id);
    }

    @Get()
    async findAll(
        @Query(ValidationPipe) filters: GoalFilterDto,
        @CurrentUser() currentUser: User,
    ): Promise<{
        goals: GoalResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return this.goalsService.findAll(filters, currentUser);
    }
    
    @Get('statistics')
    async getStatistics(
        @Query('volunteerId') volunteerId: string,
        @CurrentUser() currentUser: User,
    ): Promise<{
        totalGoals: number;
        completedGoals: number
        pendingGoals: number;
        inProgressGoals: number;
        overdueGoals: number;
        completionRate: number;
        averageProgress: number;
        categoriesCount: number;
        upcomingDeadlines: GoalResponseDto[];
    }> {
        const targetVolunteerId = currentUser.role === UserRole.ADMIN ? volunteerId : currentUser.id;

        return this.goalsService.getGoalStatistics(targetVolunteerId);
    }

    @Get('categories')
    async getCategories(): Promise<{ categories: string[]}> {
        const categories = await this.goalsService.getCategories();
        return { categories };
    }

    @Post('weekly-processing')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async processWeeklyGoals(): Promise<WeeklyProcessingResultDto> {
        return this.goalsService.processWeeklyGoals();
    }

    @Post('process-overdue')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async processOverdueGoals(): Promise<{ message: string }> {
        return this.goalsService.processOverdueGoals();
    }

    @Post('bulk/update')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async bulkUpdate(
        @Body(ValidationPipe) bulkUpdateDto: BulkUpdateGoalsDto,
        @CurrentUser() currentUser: User,
    ): Promise<{ message: string, updatedGoals: number }> {
        return this.goalsService.bulkUpdate(bulkUpdateDto, currentUser);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() curreentUser: User,
    ): Promise<GoalResponseDto> {
        return this.goalsService.findOne(id, curreentUser);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateGoalDto: UpdateGoalDto,
        @CurrentUser() currentUser: User,
    ): Promise<GoalResponseDto> {
        return this.goalsService.update(id, updateGoalDto, currentUser);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateStatusDto: UpdateGoalStatusDto,
        @CurrentUser() currentUser: User,
    ): Promise<GoalResponseDto> {
        return this.goalsService.updateStatus(id, updateStatusDto, currentUser);
    }

    @Patch(':id/progress')
    async updateProgress(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateProgressDto: UpdateGoalProgressDto,
        @CurrentUser() currentUser: User,
    ): Promise<GoalResponseDto> {
        return this.goalsService.updateProgress(id, updateProgressDto, currentUser);
    }
    
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<void> {
        return this.goalsService.remove(id, currentUser);
    }

}
