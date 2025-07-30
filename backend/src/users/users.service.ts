import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, SelectQueryBuilder, In, Between } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Goal } from '../database/entities';
import { ActivityLog } from '../database/entities';
import { UserStatus, Performance } from '../database/enums/user.enums';
import { GoalStatus } from '../database/enums/goals.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { UpdateUserStatusDto } from './dto/user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserAnalyticsDto } from './dto/user-analytics.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }


        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            status: createUserDto.status || UserStatus.ACTIVE,
            performance: Performance.AVERAGE,
            goalsCount: 0,
            completionRate: 0,
        })

        const savedUser = await this.userRepository.save(user);

        await this.logActivity(
            savedUser.id,
            'CREATE_USER',
            'user',
            savedUser.id,
            { email: savedUser.email, role: savedUser.role }
        );

        return new UserResponseDto(savedUser);
    }

    async findAll(filters: UserFiltersDto): Promise<{
        users: UserResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.goals', 'goals');

        this.applyFilters(queryBuilder, filters);

        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'DESC';
        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [users, total] = await queryBuilder.getManyAndCount();

        const usersWithStats= await Promise.all(
            users.map(async (users) => {
                const stats = await this.calculateUserStats(users.id);
                users.goalsCount = stats.totalGoals;
                users.completionRate = stats.completionRate;
                await this.userRepository.save(users);
                return new UserResponseDto(users);
            })
        )


        return {
            users: usersWithStats,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['goals', 'progressHistory'],
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const stats = await this.calculateUserStats(id);
        user.goalsCount = stats.totalGoals;
        user.completionRate = stats.completionRate;
        await this.userRepository.save(user);

        return new UserResponseDto(user);
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.userRepository.findOne({ where: { email: updateUserDto.email } });
            if (existingUser) {
                throw new ConflictException('A user with this email already exists');
            }
        }

        if (updateUserDto.phoneNumber && updateUserDto.phoneNumber !== user.phoneNumber) {
            const existingUser = await this.userRepository.findOne({ where: { phoneNumber: updateUserDto.phoneNumber } });
            if (existingUser) {
                throw new ConflictException('A user with this phone number already exists');
            }
        }

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        Object.assign(user, updateUserDto);
        const updatedUser = await this.userRepository.save(user);

        await this.logActivity(
            id,
            'UPDATE_USER',
            'user',
            id,
            { updateFields: Object.keys(updateUserDto) },
        );

        return new UserResponseDto(updatedUser);
    }

    async updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.status = updateUserStatusDto.status;
        const updatedUser = await this.userRepository.save(user);

        await this.logActivity(
            id,
            'UPDATE_USER_STATUS',
            'user',
            id,
            { status: updateUserStatusDto.status },
        );

        return new UserResponseDto(updatedUser);
    }

    async remove(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const activeGoals = await this.goalRepository.find({
            where: { volunteerId: id, status: GoalStatus.IN_PROGRESS },
        });
        if (activeGoals.length > 0) {
            throw new BadRequestException('Cannot delete user with active goals');
        }

        await this.logActivity(
            id,
            'DELETE_USER',
            'user',
            id,
            { email: user.email, role: user.role }
        );

        await this.userRepository.remove(user);
    }

    async getUserAnalytics(id: string): Promise<UserAnalyticsDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const goals = await this.goalRepository.find({
            where: { volunteerId: id },
            relations: ['progressHistory'],
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
        const pendingGoals = goals.filter(goal => goal.status === GoalStatus.IN_PROGRESS).length;
        const overdueGoals = goals.filter(goal => goal.status === GoalStatus.OVERDUE).length;

        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        const averageProgress = totalGoals > 0 ? Math.round(
            goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / totalGoals
        ) : 0;

        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const thisMonthStart = new Date(new Date().getFullYear(), currentMonth, 1);

        const goalsThisMonth = goals.filter(goal =>
            goal.createdAt >= thisMonthStart
        ).length;

        const goalsLastMonth = goals.filter(goal =>
            goal.createdAt.getMonth() === lastMonth &&
            goal.createdAt < thisMonthStart
        ).length;

        const monthlyGrowth = goalsLastMonth > 0
            ? Math.round(((goalsThisMonth - goalsLastMonth) / goalsLastMonth) * 100)
            : 0;

        const categoryMap = new Map<string, { count: number; completionRate: number }>();
        goals.forEach(goal => {
            const category = goal.category || 'Uncategorized';
            const existing = categoryMap.get(category) || { count: 0, completionRate: 0 };
            existing.count++;
            if (goal.status === GoalStatus.COMPLETED) {
                existing.completionRate++;
            }
            categoryMap.set(category, existing);
        });

        const categoryBreakdown= Array.from(categoryMap.entries()).map(([category, stats]) => ({
            category,
            count: stats.count,
            completionRate: stats.count > 0 ? Math.round((stats.completionRate / stats.count) * 100) : 0,
        }));

        const recentActivity = await this.activityLogRepository.find({
            where: { userId: id },
            order: { createdAt: 'DESC' },
            take: 10,
        });

        const activityWithGoals = await Promise.all(
            recentActivity.map(async (activity) => {
                let goalTitle: string | undefined;
                if (activity.resource === 'goal' && activity.resourceId) {
                    const goal = await this.goalRepository.findOne({ where: { id: activity.resourceId } });
                    goalTitle = goal ? goal.title : undefined;
                }
                return {
                    date: activity.createdAt,
                    action: activity.action,
                    goalTitle: goalTitle,
                };
            })
        );

        const performanceTrend = await this.calculatePerformanceTrend(id);

        return {
            userId: id,
            totalGoals,
            completedGoals,
            pendingGoals,
            overdueGoals,
            completionRate,
            averageProgress,
            goalsThisMonth,
            goalsLastMonth,
            monthlyGrowth,
            categoryBreakdown,
            recentActivity: activityWithGoals,
            performanceTrend,
        };
    }

    async getPerformanceMetrics(id: string): Promise<{
        totalGoals: number;
        completedGoals: number;
        completionRate: number;
        overdueGoals: number;
        averageProgress: number;
    }> {
        const stats = await this.calculateUserStats(id);
        return stats;
    }

    private applyFilters(queryBuilder: SelectQueryBuilder<User>, filters: UserFiltersDto) {
        if (filters.role) {
            queryBuilder.andWhere('user.role = :role', { role: filters.role });
        }
        if (filters.status) {
            queryBuilder.andWhere('user.status = :status', { status: filters.status });
        }
        if (filters.performance) {
            queryBuilder.andWhere('user.performance = :performance', { performance: filters.performance });
        }
        if (filters.search) {
            queryBuilder.andWhere(
                '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
                { search: `%${filters.search}%` }
            );
        }
        if (filters.position) {
            queryBuilder.andWhere('user.position = :position', { position: filters.position });
        }
        if (filters.hasGoals !== undefined) {
            if (filters.hasGoals) {
                queryBuilder.andWhere('user.goalsCount > 0');
            } else {
                queryBuilder.andWhere('user.goalsCount = 0');
            }
        }
    }

    private async calculateUserStats(userId: string): Promise<{
        totalGoals: number;
        completedGoals: number;
        completionRate: number;
        overdueGoals: number;
        averageProgress: number;
    }> {
        const goals = await this.goalRepository.find({ where: { volunteerId: userId } });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
        const overdueGoals = goals.filter(goal => goal.status === GoalStatus.OVERDUE).length;

        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        const averageProgress = totalGoals > 0 ? Math.round(
            goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / totalGoals
        ) : 0;

        return {
            totalGoals,
            completedGoals,
            completionRate,
            overdueGoals,
            averageProgress,
        };
    }

    private async calculatePerformanceTrend(userId: string): Promise<{
        month: string;
        completionRate: number;
        goalsCompleted: number;
    }[]> {
        const trend: {
            month: string;
            completionRate: number;
            goalsCompleted: number;
        }[] = [];
        const currentDate = new Date();

        for (let i = 5; i>= 0; i--) {
            const monstStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

            const monthGoals = await this.goalRepository.find({
                where: {
                    volunteerId: userId,
                    createdAt: Between(monstStart, monthEnd),
                }
            });

            const completeThisMonth = monthGoals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
            const completionRate = monthGoals.length > 0
                ? Math.round((completeThisMonth / monthGoals.length) * 100)
                : 0;

            trend.push({
                month: monstStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                completionRate,
                goalsCompleted: completeThisMonth,
            });
        }

            return trend;

    }

    private async logActivity(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        details?: Record<string, any>
    ): Promise<void> {
        const activityLog = this.activityLogRepository.create({
            user: { id: userId },
            action,
            resource,
            resourceId,
            details
        });
        await this.activityLogRepository.save(activityLog);
    }

    async bulkUpdateStatus(
        userIds: string[],
        status: UserStatus
    ): Promise<void> {
        await this.userRepository.update(
            { id: In(userIds) },
            { status }
        );

        for (const userId of userIds) {
            await this.logActivity(
                userId,
                'BULK_UPDATE_USER_STATUS',
                'user',
                userId,
                { newStatus: status }
            );
        }
    }

    async exportUsers(filters: UserFiltersDto): Promise<UserResponseDto[]> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.goals', 'goals');

        this.applyFilters(queryBuilder, filters);

        const users = await queryBuilder.getMany();

        return users.map(user => new UserResponseDto(user));

    }
    

}
