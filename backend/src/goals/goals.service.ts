import { 
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import{ Repository, SelectQueryBuilder, Between, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Goal } from '../database/entities/goal.entity';
import { User } from '../database/entities/user.entity';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { GoalStatus, GoalPriority } from '../database/enums/goals.enums';
import { UserRole } from '../database/enums/user.enums';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { UpdateGoalStatusDto } from './dto/update-goal-status.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';
import { BulkUpdateGoalsDto } from './dto/bulk-update-goals.dto';
import { WeeklyProcessingResultDto } from './dto/weekly-processing.dto';
import { GoalFilterDto } from './dto/goal-filters.dto';


@Injectable()
export class GoalsService {
    constructor(
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ProgressHistory)
        private readonly progressHistoryRepository: Repository<ProgressHistory>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>
    ) {}

    async create(
        createGoalDto: CreateGoalDto,
        currentUserId: string
    ): Promise<GoalResponseDto> {
        const volunteer = await this.userRepository.findOne({
            where: { id: createGoalDto.volunteerId }
        });
        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        if (volunteer.role !== UserRole.ADMIN && currentUserId !== createGoalDto.volunteerId) {
            throw new ForbiddenException('You can only create goals for yourself');
        }

        const startDateObj = new Date(createGoalDto.startDate);
        const dueDateObj = new Date(createGoalDto.dueDate);
        if (isNaN(startDateObj.getTime()) || isNaN(dueDateObj.getTime())) {
            throw new BadRequestException('Invalid start or due date');
        }
        if (startDateObj > dueDateObj) {
            throw new BadRequestException('Start date cannot be after due date');
        }

        const goal = this.goalRepository.create({
            ...createGoalDto,
            startDate: startDateObj,
            dueDate: dueDateObj,
            status: GoalStatus.PENDING,
            progress: createGoalDto.progress || 0,
            priority: createGoalDto.priority || GoalPriority.MEDIUM,
        });

        const savedGoal = await this.goalRepository.save(goal);

        await this.updateUserGoalsCount(createGoalDto.volunteerId);

        await this.logActivity(
            currentUserId,
            'CREATE_GOAL',
            'goal',
            savedGoal.id,
            { goalTitle: savedGoal.title, volunteerId: createGoalDto.volunteerId }
        );

        return new GoalResponseDto(savedGoal);
    }

    async findAll(
        filters: GoalFilterDto,
        currentUser: User,
    ): Promise<{
        goals: GoalResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const queryBuilder = this.goalRepository
            .createQueryBuilder('goal')
            .leftJoinAndSelect('goal.volunteer', 'volunteer')

        
        if (currentUser.role === UserRole.VOLUNTEER) {
            queryBuilder.where('goal.volunteerId = :userId', {
                userId: currentUser.id
            });
        } else if (filters.volunteerId) {
            queryBuilder.where('goal.volunteerId = :volunteerId', {
                volunteerId: filters.volunteerId
            });
        }
        
        this.applyFilters(queryBuilder, filters);

        const sortBy = filters.sortBy || 'dueDate';
        const sortOrder = filters.sortOrder || 'DESC';
        queryBuilder.orderBy(`goal.${sortBy}`, sortOrder);

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [goals, total] = await queryBuilder.getManyAndCount();

        return {
            goals: goals.map(goal => new GoalResponseDto(goal)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: string, currentUser: User): Promise<GoalResponseDto> {
        const goal = await this.goalRepository.findOne({
            where: { id },
            relations: ['volunteer', 'progressHistory'],
        });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }

        if (currentUser.role !== UserRole.ADMIN && goal.volunteerId !== currentUser.id) {
            throw new ForbiddenException('You do not have permission to view this goal');
        }

        return new GoalResponseDto(goal);
    }

    async update(
        id: string,
        updateGoalDto: UpdateGoalDto,
        currentUser: User
    ): Promise<GoalResponseDto> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }

        if (currentUser.role !== UserRole.ADMIN && goal.volunteerId !== currentUser.id) {
            throw new ForbiddenException('You do not have permission to update this goal');
        }

        let dueDate: Date | undefined;
        if (updateGoalDto.dueDate) {
            dueDate = new Date(updateGoalDto.dueDate);
        }
        Object.assign(goal, updateGoalDto);
        if (dueDate) {
            goal.dueDate = dueDate;
        }
        Object.assign(goal, updateGoalDto);
        const updatedGoal = await this.goalRepository.save(goal);

        if (updateGoalDto.status && updateGoalDto.status !== goal.status) {
            await this.updateUserGoalsCount(goal.volunteerId);
        }

        await this.logActivity(
            currentUser.id,
            'UPDATE_GOAL',
            'goal',
            id,
            { updatedFields: Object.keys(updateGoalDto), goalTitle: updatedGoal.title }
        );

        return new GoalResponseDto(updatedGoal);
    }

    async updateStatus(
        id: string,
        updateGoalStatusDto: UpdateGoalStatusDto,
        currentUser: User
    ): Promise<GoalResponseDto> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }

        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== goal.volunteerId) {
            throw new ForbiddenException('You do not have permission to update this goal status');
        }

        const previousStatus = goal.status;
        goal.status = updateGoalStatusDto.status;

        if (updateGoalStatusDto.status === GoalStatus.COMPLETED) {
            goal.progress = 100;
        } else if (updateGoalStatusDto.status === GoalStatus.PENDING) {
            goal.progress = 0;
        }

        const updatedGoal = await this.goalRepository.save(goal);

        await this.updateUserGoalsCount(goal.volunteerId);

        await this.logActivity(
            currentUser.id,
            'UPDATE_GOAL_STATUS',
            'goal',
            id,
            {
                previousStatus,
                newStatus: updatedGoal.status,
                goalTitle: updatedGoal.title
            }
        );

        return new GoalResponseDto(updatedGoal);
    }

    async updateProgress(
        id: string,
        updateGoalProgressDto: UpdateGoalProgressDto,
        currentUser: User
    ): Promise<GoalResponseDto> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }

        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== goal.volunteerId) {
            throw new ForbiddenException('You do not have permission to update this goal progress');
        }

        if (updateGoalProgressDto.progress < 0 || updateGoalProgressDto.progress > 100) {
            throw new BadRequestException('Progress must be between 0 and 100');
        }

        const previousProgress = goal.progress;
        goal.progress = updateGoalProgressDto.progress;


        if (updateGoalProgressDto.progress === 100) {
            goal.status = GoalStatus.COMPLETED;
        } else if (updateGoalProgressDto.progress > 0 && goal.status === GoalStatus.PENDING) {
            goal.status = GoalStatus.IN_PROGRESS;
        }

        if (updateGoalProgressDto.notes) {
            goal.notes = goal.notes || [];
            goal.notes.push(`${new Date().toISOString()}: ${updateGoalProgressDto.notes}`);
        }

        const updatedGoal = await this.goalRepository.save(goal);

        await this.updateUserGoalsCount(goal.volunteerId);

        await this.logActivity(
            currentUser.id,
            'UPDATE_GOAL_PROGRESS',
            'goal',
            id,
            { 
                previousProgress,
                newProgress: updatedGoal.progress,
                goalTitle: updatedGoal.title 
            }
        );

        return new GoalResponseDto(updatedGoal);
    }

    async remove(id: string, currentUser: User): Promise<void> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new NotFoundException(`Goal with ID ${id} not found`);
        }

        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only admins can delete goals');
        }

        await this.logActivity(
            currentUser.id,
            'DELETE_GOAL',
            'goal',
            id,
            { goalTitle: goal.title, volunteerId: goal.volunteerId }
        );

        await this.goalRepository.remove(goal);
        
        await this.updateUserGoalsCount(goal.volunteerId);
    }

    async bulkUpdate(
        bulkUpdateGoalsDto: BulkUpdateGoalsDto,
        currentUser: User
    ): Promise<{ message: string; updatedGoals: number }> {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only admins can perform bulk updates');
        }

        const goals = await this.goalRepository.findBy({ id: In(bulkUpdateGoalsDto.goalIds) });

        if (goals.length === 0) {
            throw new NotFoundException('No goals found for the provided IDs');
        }

        const updateData: Partial<Goal> = {};
        if (bulkUpdateGoalsDto.status) updateData.status = bulkUpdateGoalsDto.status;
        if (bulkUpdateGoalsDto.priority) updateData.priority = bulkUpdateGoalsDto.priority;

        await this.goalRepository.update(
            { id: In(bulkUpdateGoalsDto.goalIds) },
            updateData
        );

        const volunteerIds = [...new Set(goals.map(goal => goal.volunteerId))];
        for (const volunteerId of volunteerIds) {
            await this.updateUserGoalsCount(volunteerId);
        }

        await this.logActivity(
            currentUser.id,
            'BULK_UPDATE_GOALS',
            'goal',
            'bulk',
            {
                goalIds: bulkUpdateGoalsDto.goalIds,
                updates: updateData
            }
        )

        return {
            message: `Successfully updated ${goals.length} goals`,
            updatedGoals: goals.length
        }
    }

    async getGoalStatistics(volunteerId?: string): Promise<{
        totalGoals: number;
        completedGoals: number;
        pendingGoals: number;
        overdueGoals: number;
        inProgressGoals: number;
        completionRate: number;
        averageProgress: number;
        categoriesCount: number;
        upcomingDeadlines: GoalResponseDto[];
    }> {
        const whereCondition = volunteerId ? { volunteerId } : {};

        const goals = await this.goalRepository.find({
            where: whereCondition,
            order: { dueDate: 'ASC' }
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length
        const pendingGoals = goals.filter(goal => goal.status === GoalStatus.PENDING).length;
        const inProgressGoals = goals.filter(goal => goal.status === GoalStatus.IN_PROGRESS).length
        const overdueGoals = goals.filter(goal => goal.status === GoalStatus.OVERDUE).length;

        const completionRate = totalGoals > 0
            ? Math.round((completedGoals / totalGoals) * 100)
            : 0;
        const averageProgress = totalGoals > 0
            ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals)
            : 0;

        const categories = new Set(goals.map(goal => goal.category));
        const categoriesCount = categories.size;

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingDeadlines = goals
            .filter(goal => {
                goal.status !== GoalStatus.COMPLETED &&
                goal.dueDate <= nextWeek &&
                goal.dueDate >= new Date()
            })
            .slice(0, 5)
            .map(goal => new GoalResponseDto(goal));


        return {
            totalGoals,
            completedGoals,
            pendingGoals,
            overdueGoals,
            inProgressGoals,
            completionRate,
            averageProgress,
            categoriesCount,
            upcomingDeadlines
        }
    }

    async getCategories(): Promise<string[]> {
        const result = await this.goalRepository
            .createQueryBuilder('goal')
            .select('DISTINCT goal.category', 'category')
            .getRawMany();

        return result.map(row => row.category).filter(Boolean);
    }


    @Cron(CronExpression.EVERY_WEEKEND)
    async processWeeklyGoals(): Promise<WeeklyProcessingResultDto> {
        console.log('Starting weekly goal processing...');

        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const goalsThisWeek = await this.goalRepository.find({
            where: {
                dueDate: Between(weekStart, weekEnd),
            },
            relations: ['volunteer']
        });

        let processedGoals = 0;
        let completedGoals = 0;
        let overdueGoals = 0;
        let progressHistoryEntries = 0;


        for (const goal of goalsThisWeek) {
            const progressHistory = this.progressHistoryRepository.create({
                goalId: goal.id,
                title: goal.title,
                volunteerId: goal.volunteerId,
                progress: goal.progress,
                status: goal.status,
                weekStart,
                weekEnd,
                notes: goal.notes ? goal.notes.join(', ') : undefined,
            });

            await this.progressHistoryRepository.save(progressHistory);
            progressHistoryEntries++;

            if (goal.status !== GoalStatus.COMPLETED && goal.dueDate < today) {
                goal.status = GoalStatus.OVERDUE;
                await this.goalRepository.save(goal);
                overdueGoals++;

                await this.logActivity(
                    'system',
                    'MARK_GOAL_OVERDUE',
                    'goal',
                    goal.id,
                    {
                        goalTitle: goal.title,
                        originalDueDate: goal.dueDate,
                    },
                );
            }

            if (goal.status === GoalStatus.COMPLETED) {
                completedGoals++;
            }

            processedGoals++;
        }

        const users = await this.userRepository.find();
        for (const user of users) {
            await this.updateUserGoalsCount(user.id);
        }

        const result: WeeklyProcessingResultDto = {
            processedGoals,
            completedGoals,
            overdueGoals,
            progressHistoryEntries,
            weekStart,
            weekEnd,
            processedAt: new Date(),
        };
        
        console.log('Weekly goal processing completed:', result);
        return result;
    }

    async processOverdueGoals(): Promise<{ message: string; processedGoals: number }> {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const overdueGoals = await this.goalRepository.find({
            where: {
                status: In([GoalStatus.PENDING, GoalStatus.COMPLETED]),
                dueDate: LessThan(today),
            },
            relations: ['volunteer'],
        });

        if (overdueGoals.length === 0) {
            return { message: 'No overdue goals found', processedGoals: 0 };
        }

        for (const goal of overdueGoals) {
            goal.status = GoalStatus.OVERDUE;
            await this.goalRepository.save(goal);

            await this.logActivity(
                'system',
                'MARK_GOAL_OVERDUE',
                'goal',
                goal.id,
                { goalTitle: goal.title, originalDueDate: goal.dueDate }
            );
        }

        return { message: `Processed ${overdueGoals.length} overdue goals`, processedGoals: overdueGoals.length };
    }


    private async applyFilters(
        queryBuilder: SelectQueryBuilder<Goal>,
        filters: GoalFilterDto
    ): Promise<void> {
        if (filters.status) {
            queryBuilder.andWhere('goal.status = :status', { status: filters.status });
        }

        if (filters.priority) {
            queryBuilder.andWhere('goal.priority = :priority', { priority: filters.priority });
        }

        if (filters.category) {
            queryBuilder.andWhere('goal.category = :category', { category: filters.category });
        }

        if (filters.volunteerId) {
            queryBuilder.andWhere('goal.volunteerId = :volunteerId', { volunteerId: filters.volunteerId });
        }

        if (filters.dueDateTo) {
            queryBuilder.andWhere('goal.dueDate <= :dueDateTo', { dueDateTo: new Date(filters.dueDateTo) });
        }

        if (filters.dueDateFrom) {
            queryBuilder.andWhere('goal.dueDate >= :dueDateFrom', { dueDateFrom: new Date(filters.dueDateFrom) });
        }

        if (filters.search) {
            queryBuilder.andWhere(
                '(goal.title LIKE :search OR goal.description LIKE :search)',
                { search: `%${filters.search}%` }
            );
        }
    }

    async updateUserGoalsCount(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return;

        const totalGoals = await this.goalRepository.find({ where: { volunteerId: userId } });
        const completedGoals = totalGoals.filter(goal => goal.status === GoalStatus.COMPLETED);
        
        user.goalsCount = totalGoals.length;
        user.completionRate = totalGoals.length > 0 ? Math.round((completedGoals.length / totalGoals.length) * 100) : 0;

        await this.userRepository.save(user);

    }

    private async logActivity(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        details?: Record<string, any>
    ): Promise<void> {
        const activityLog = this.activityLogRepository.create({
            userId,
            action,
            resource,
            resourceId,
            details,
        });

        await this.activityLogRepository.save(activityLog);
    }
}
