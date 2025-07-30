import { Injectable,
    NotFoundException,
    ForbiddenException,
    BadGatewayException
 } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, In, RelationQueryBuilder } from 'typeorm';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { Goal } from '../database/entities';
import { User } from '../database/entities';
import { ActivityLog } from '../database/entities';
import { GoalStatus, GoalPriority } from '../database/enums/goals.enums';
import { UserRole } from '../database/enums/user.enums';
import { CreateProgressHistoryDto } from './dto/create-progress-history.dto';
import { ProgressHistoryResponseDto } from './dto/progress-history-response.dto';
import { ProgressHistoryFiltersDto } from './dto/progress-history-filters.dto';
import { VolunteerTrendsDto } from './dto/volunteer-trends.dto';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';
import { AnalyticsSummaryDto, HistoricalGoalDto, HistoricalWeekDto, VolunteerWeeklyHistoryDto, MostProductiveDayDto } from './dto/analytics-summary.dto';


@Injectable()
export class ProgressHistoryService {
    constructor(
        @InjectRepository(ProgressHistory)
        private readonly progressHistoryRepository: Repository<ProgressHistory>,
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>
    ) {}

    async create(
        createProgressHistoryDto: CreateProgressHistoryDto,
        currentUser: User,
    ): Promise<ProgressHistoryResponseDto> {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You do not have permission to create progress history.');
        }

        const goal = await this.goalRepository.findOne({
            where: { id: createProgressHistoryDto.goalId },
            relations:['volunteer'],
        });
        if (!goal) {
            throw new NotFoundException('Goal not found.');
        }

        const volunteer = await this.userRepository.findOne({
            where: { id: createProgressHistoryDto.volunteerId },
        });
        if (!volunteer){
            throw new NotFoundException('Volunteer not found.');
        }

        const progressHistory = this.progressHistoryRepository.create({
            ...createProgressHistoryDto,
            weekStart: new Date(createProgressHistoryDto.weekStart),
            weekEnd: new Date(createProgressHistoryDto.weekEnd),
        });

        const savedProgressHistory = await this.progressHistoryRepository.save(progressHistory);

        await this.logActivity(
            currentUser.id,
            'CREATE_PROGRESS_HISTORY',
            'progress_history',
            savedProgressHistory.id,
            {
                goalTitle: createProgressHistoryDto.title,
                volunteerId: createProgressHistoryDto.volunteerId,
            }
        );

        return this.mapToResponseDto(savedProgressHistory, goal, volunteer);
    }

    async findAll(
        filters: ProgressHistoryFiltersDto,
        currentUser: User,
    ): Promise<{
        progressHistory: ProgressHistoryResponseDto[];
        total:number;
        page:number;
        limit: number;
        totalPages: number;
    }> {
        const queryBuilder = this.progressHistoryRepository
            .createQueryBuilder('ph')
            .leftJoinAndSelect('ph.goal', 'goal')
            .leftJoinAndSelect('ph.volunteer', 'volunteer');

        if (currentUser.role === UserRole.VOLUNTEER) {
            queryBuilder.where('ph.volunteerId = userId', { userId: currentUser.id});
        } else if (filters.volunteerId) {
            queryBuilder.where('ph.volunteerId = :volunteerId', { volunteerId: filters.volunteerId });
        }

        await this.applyFilters(queryBuilder, filters);

        const sortBy = filters.sortBy || 'weekStart';
        const sortOrder = filters.sortOrder || 'DESC';
        queryBuilder.orderBy(`ph.${sortBy}`, sortOrder);

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [progressHistoryEntries, total] = await queryBuilder.getManyAndCount();

        const mappedEntries = progressHistoryEntries.map(entry =>
            this.mapToResponseDto(entry, entry.goal, entry.volunteer),
        );

        return {
            progressHistory: mappedEntries,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, currentUser: User): Promise<ProgressHistoryResponseDto> {
        const progressHistory = await this.progressHistoryRepository.findOne({
            where: { id },
            relations: ['goal', 'volunteer'],
        });

        if (!progressHistory) {
            throw new NotFoundException('Progress history not found.');
        }

        if (currentUser.role !== UserRole.ADMIN && progressHistory.volunteerId !== currentUser.id) {
            throw new ForbiddenException('You do not have permission to view this progress history.');
        }

        return this.mapToResponseDto(progressHistory, progressHistory.goal, progressHistory.volunteer);
    }

    async getVolunteerTrends(
        volunteerId: string,
        currentUser: User,
    ): Promise<VolunteerTrendsDto> {
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== volunteerId) {
            throw new ForbiddenException('You do not have permission to view this volunteer trends.');
        }

        const volunteer = await this.userRepository.findOne({ where: { id: volunteerId } });
        if (!volunteer) {
            throw new NotFoundException('Volunteer not found.');
        }

        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const progressHistory = await this.progressHistoryRepository.find({
            where: {
                volunteerId,
                weekStart: Between(twelveWeeksAgo, new Date()),
            },
            order:{ weekStart: 'ASC' },
        });

        const weeklyMap = new Map<string, typeof progressHistory>();
        progressHistory.forEach(entry => {
            const weekKey = entry.weekStart.toISOString().split('T')[0];
            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, []);
            }
            weeklyMap.get(weekKey)!.push(entry);
        });

        const weeklyTrends = Array.from(weeklyMap.entries()).map(([weekKey, entries]) => {
            const totalGoals = entries.length;
            const completedGoals = entries.filter(entry => entry.status === GoalStatus.COMPLETED).length;
            const averageProgress = totalGoals > 0
                ? Math.round(entries.reduce((sum, entry) => sum + entry.progress, 0) / totalGoals) : 0;
            const completionRate = totalGoals > 0
                ? Math.round((completedGoals / totalGoals) * 100) : 0

            
            return {
                weekStart: entries[0].weekStart,
                weekEnd: entries[0].weekEnd,
                totalGoals,
                completedGoals,
                averageProgress,
                completionRate,
            };
        });

        const totalEntries = progressHistory.length;
        const overallAverageProgress = totalEntries > 0
            ? Math.round(progressHistory.reduce((sum, entry) => sum + entry.progress, 0) / totalEntries) : 0;
        const overallCompletionRate = totalEntries > 0
            ? Math.round((progressHistory.filter(entry => entry.status === GoalStatus.COMPLETED).length / totalEntries) * 100) : 0;

        const bestWeek = weeklyTrends.length > 0
            ? weeklyTrends.reduce((best, current) =>
                current.completionRate > best.completionRate ? current : best, weeklyTrends[0]) : null;

        let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (weeklyTrends.length >= 4) {
            const lastFourWeeks = weeklyTrends.slice(-4);
            const first2Average = (lastFourWeeks[0].completionRate + lastFourWeeks[1].completionRate) / 2;
            const last2Average = (lastFourWeeks[2].completionRate + lastFourWeeks[3].completionRate) / 2;

            if (last2Average > first2Average + 5) improvementTrend = 'improving';
            else if (last2Average < first2Average - 5) improvementTrend = 'declining';
        }

        return {
            volunteerId: volunteer.id,
            volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
            weeklyTrends,
            overallStats: {
                totalEntries,
                averageProgress: overallAverageProgress,
                completionRate: overallCompletionRate,
                bestWeek: bestWeek ? {
                    weekStart: bestWeek.weekStart,
                    completionRate: bestWeek.completionRate,
                } : null,
                improvementTrend,
            },
        };
    }

    async getMonthlySummary(
        month: number,
        year: number,
        volunteerId: string,
        currentUser: User,
    ): Promise<MonthlySummaryDto> {
        if (volunteerId && currentUser) {
            if (currentUser.role !== UserRole.ADMIN && currentUser.id !== volunteerId) {
                throw new ForbiddenException('You do not have permission to view this monthly summary.');
            }
        }

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const whereCondition: any = {
            weekStart: Between(monthStart, monthEnd),
        };;
        if (volunteerId) {
            whereCondition.volunteerId = volunteerId;
        }
        const progressHistory = await this.progressHistoryRepository.find({
            where: whereCondition,
            relations: ['goal'],
            order: { weekStart: 'ASC' },
        });

        const totalEntries = progressHistory.length;
        const completedGoals = progressHistory.filter(entry => entry.status === GoalStatus.COMPLETED).length;
        const averageProgress = totalEntries > 0
            ? Math.round(progressHistory.reduce((sum, entry) => sum + entry.progress, 0) / totalEntries) : 0;
        const completionRate = totalEntries > 0
            ? Math.round((completedGoals / totalEntries) * 100) : 0;

        const categoriesSet = new Set<string>();
        progressHistory.forEach(entry => {
            if (entry.goal?.category) {
                categoriesSet.add(entry.goal.category);
            }
        });
        const categoriesWorked = Array.from(categoriesSet);

        const weeklyMap = new Map<string, typeof progressHistory>();
        progressHistory.forEach(entry => {
            const weekKey = `${entry.weekStart.getTime()}`;
            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, []);
            }
            weeklyMap.get(weekKey)!.push(entry);
        });

        const weeklyBreakdown = Array.from(weeklyMap.entries()).map(([weekKey, entries]) => ({
            weekStart: entries[0].weekStart,
            weekEnd: entries[0].weekEnd,
            entries: entries.length,
            averageProgress: entries.length > 0
                ? Math.round(entries.reduce((sum, entry) => sum + entry.progress, 0) / entries.length)
                : 0,
        }))
    
        
        const categoryMap = new Map<string, { entries: number; completed: number }>();
        progressHistory.forEach(entry => {
            if (entry.goal?.category) {
                const category = entry.goal.category;
                const existing = categoryMap.get(category) || { entries: 0, completed: 0};
                existing.entries++;
                if (entry.status === GoalStatus.COMPLETED) {
                    existing.completed++;
                }
                categoryMap.set(category, existing);
            }
        });

        const topCategories = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
            category,
            entries: stats.entries,
            completionRate: stats.entries > 0 ? Math.round((stats.completed / stats.entries) * 100) : 0,
        }))
        .sort((a, b) => b.entries - a.entries)
        .slice(0, 5);

        // Calculate progress distribution
        const progressRanges = [
        { range: '0-20%', min: 0, max: 20 },
        { range: '21-40%', min: 21, max: 40 },
        { range: '41-60%', min: 41, max: 60 },
        { range: '61-80%', min: 61, max: 80 },
        { range: '81-100%', min: 81, max: 100 },
        ];

        const progressDistribution = progressRanges.map(range => {
        const count = progressHistory.filter(entry => 
            entry.progress >= range.min && entry.progress <= range.max
        ).length;
        return {
            range: range.range,
            count,
            percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
        };
        });

        return {
        month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        year,
        volunteerId,
        summary: {
            totalEntries,
            completedGoals,
            averageProgress,
            completionRate,
            categoriesWorked,
            weeklyBreakdown,
        },
        topCategories,
        progressDistribution,
        };
    }


    
    async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
        const allEntries = await this.progressHistoryRepository.find({
        relations: ['goal', 'volunteer'],
        order: { weekStart: 'DESC' },
        });

        const totalEntries = allEntries.length;
        const totalVolunteers = new Set(allEntries.map(entry => entry.volunteerId)).size;
        const completedEntries = allEntries.filter(entry => entry.status === GoalStatus.COMPLETED).length;
        const overallCompletionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
        const averageProgress = totalEntries > 0
            ? Math.round(allEntries.reduce((sum, entry) => sum + entry.progress, 0) / totalEntries)
            : 0;

        // Status distribution
        const statusMap = new Map<GoalStatus, number>();
        Object.values(GoalStatus).forEach(status => statusMap.set(status, 0));
        allEntries.forEach(entry => {
            statusMap.set(entry.status, (statusMap.get(entry.status) || 0) + 1);
        });

        const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
            status,
            count,
            percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
        }));

        // Category performance
        const categoryMap = new Map<string, { entries: number; totalProgress: number; completed: number }>();
        allEntries.forEach(entry => {
            if (entry.goal?.category) {
                const category = entry.goal.category;
                const existing = categoryMap.get(category) || { entries: 0, totalProgress: 0, completed: 0 };
                existing.entries++;
                existing.totalProgress += entry.progress;
                if (entry.status === GoalStatus.COMPLETED) {
                    existing.completed++;
                }
                categoryMap.set(category, existing);
            }
        });

        const categoryPerformance = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
            category,
            entries: stats.entries,
            averageProgress: stats.entries > 0 ? Math.round(stats.totalProgress / stats.entries) : 0,
            completionRate: stats.entries > 0 ? Math.round((stats.completed / stats.entries) * 100) : 0,
        }))
        .sort((a, b) => b.entries - a.entries);

        // Weekly trends (last 8 weeks)
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

        const recentEntries = allEntries.filter(entry => entry.weekStart >= eightWeeksAgo);
        const weeklyMap = new Map<string, typeof recentEntries>();
        
        recentEntries.forEach(entry => {
        const weekKey = entry.weekStart.toISOString().split('T')[0];
        if (!weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, []);
        }
        weeklyMap.get(weekKey)!.push(entry);
        });

        const weeklyTrends = Array.from(weeklyMap.entries())
        .map(([, entries]) => {
            const totalEntries = entries.length;
            const completedEntries = entries.filter(entry => entry.status === GoalStatus.COMPLETED).length;
            return {
            weekStart: entries[0].weekStart,
            weekEnd: entries[0].weekEnd,
            totalEntries,
            averageProgress: totalEntries > 0
                ? Math.round(entries.reduce((sum, entry) => sum + entry.progress, 0) / totalEntries)
                : 0,
            completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0,
            };
        })
        .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

        // Top performers
        const volunteerMap = new Map<string, { 
        name: string; 
        entries: number; 
        totalProgress: number; 
            completed: number; 
        }>();
        
        allEntries.forEach(entry => {
            if (entry.volunteer) {
                const volunteerId = entry.volunteerId;
                const existing = volunteerMap.get(volunteerId) || { 
                    name: `${entry.volunteer.firstName} ${entry.volunteer.lastName}`,
                    entries: 0, 
                    totalProgress: 0, 
                    completed: 0 
                };
                existing.entries++;
                existing.totalProgress += entry.progress;
                if (entry.status === GoalStatus.COMPLETED) {
                    existing.completed++;
                }
                volunteerMap.set(volunteerId, existing);
            }
        });

        const topPerformers = Array.from(volunteerMap.entries())
        .map(([volunteerId, stats]) => ({
            volunteerId,
            volunteerName: stats.name,
            completionRate: stats.entries > 0 ? Math.round((stats.completed / stats.entries) * 100) : 0,
            averageProgress: stats.entries > 0 ? Math.round(stats.totalProgress / stats.entries) : 0,
            totalEntries: stats.entries,
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 10);

        // Recent activity (from activity logs)
        const recentActivity = await this.activityLogRepository.find({
        where: {
            resource: In(['goal', 'progress_history']),
        },
        order: { createdAt: 'DESC' },
        take: 20,
        relations: ['user'],
        });

        const activityWithDetails = await Promise.all(
            recentActivity.map(async (activity) => {
                let goalTitle: string = '';
                if (activity.resource === 'goal') {
                const goal = await this.goalRepository.findOne({
                    where: { id: activity.resourceId },
                });
                goalTitle = goal?.title || 'Unknown Goal';
                }

                return {
                date: activity.createdAt,
                action: activity.action,
                volunteerName: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
                goalTitle,
                progress: activity.details?.newProgress,
                };
            })
        );

        return {
            totalEntries,
            totalVolunteers,
            overallCompletionRate,
            averageProgress,
            statusDistribution,
            categoryPerformance,
            weeklyTrends,
            topPerformers,
            recentActivity: activityWithDetails,
        };
    }



    async remove(id: string, currentUser: User): Promise<void> {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can delete progress history entries');
        }

        const progressHistory = await this.progressHistoryRepository.findOne({ where: { id } });
        if (!progressHistory) {
            throw new NotFoundException(`Progress history entry with ID ${id} not found`);
        }

        await this.logActivity(
            currentUser.id,
            'DELETE_PROGRESS_HISTORY',
            'progress_history',
            id,
            { 
                title: progressHistory.title, 
                volunteerId: progressHistory.volunteerId
            },
        );

        await this.progressHistoryRepository.remove(progressHistory);
    }

    async getVolunteerWeeklyHistory(
        volunteerId: string,
        currentUser: User,
        startDate?: string,
        endDate?: string,
        ): Promise<VolunteerWeeklyHistoryDto> {
        // Check permissions
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== volunteerId) {
            throw new ForbiddenException('You can only view your own weekly history');
        }

        const volunteer = await this.userRepository.findOne({ where: { id: volunteerId } });
        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        // Build date range - default to last 6 months if not specified
        let dateFrom = startDate ? new Date(startDate) : new Date();
        let dateTo = endDate ? new Date(endDate) : new Date();
        
        if (!startDate) {
            dateFrom.setMonth(dateFrom.getMonth() - 6);
            dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay()); // Start of week
        }
        if (!endDate) {
            dateTo.setDate(dateTo.getDate() + (6 - dateTo.getDay())); // End of week
        }

        // Get all progress history entries for the volunteer in the date range
        const progressHistory = await this.progressHistoryRepository.find({
            where: {
            volunteerId,
            weekStart: Between(dateFrom, dateTo),
            },
            relations: ['goal'],
            order: { weekStart: 'DESC' },
        });

        // Group by week (using weekStart as the key)
        const weeklyMap = new Map<string, typeof progressHistory>();
        progressHistory.forEach(entry => {
            const weekKey = entry.weekStart.toISOString();
            if (!weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, []);
            }
            weeklyMap.get(weekKey)!.push(entry);
        });

        // Convert to HistoricalWeekDto array
        const weeks: HistoricalWeekDto[] = Array.from(weeklyMap.entries())
            .map(([weekKey, entries]) => {
            const weekStart = entries[0].weekStart;
            const weekEnd = entries[0].weekEnd;
            
            // Map progress history entries to goals
            const goals: HistoricalGoalDto[] = entries.map(entry => ({
                id: entry.goalId, // Use goalId instead of progress history id
                title: entry.title,
                status: this.mapGoalStatus(entry.status),
                progress: entry.progress,
                priority: this.mapGoalPriority(entry.goal?.priority),
                category: entry.goal?.category || 'Uncategorized',
                notes: entry.notes,
            }));

            const totalGoals = goals.length;
            const completedGoals = goals.filter(goal => goal.status === 'completed').length;
            const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
            const averageProgress = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0;
            const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

            return {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                totalGoals,
                completedGoals,
                averageProgress,
                completionRate,
                goals,
            };
            })
            .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());

        const totalWeeks = weeks.length;
        const totalGoals = weeks.reduce((sum, week) => sum + week.totalGoals, 0);
        const completedGoals = weeks.reduce((sum, week) => sum + week.completedGoals, 0);
        const averageProgress = totalWeeks > 0 
            ? Math.round(weeks.reduce((sum, week) => sum + week.averageProgress, 0) / totalWeeks)
            : 0;
        const averageCompletionRate = totalWeeks > 0
            ? Math.round(weeks.reduce((sum, week) => sum + week.completionRate, 0) / totalWeeks)
            : 0;

        return {
            volunteerId,
            volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
            totalWeeks,
            overallStats: {
            totalGoals,
            completedGoals,
            averageProgress,
            averageCompletionRate,
            },
            weeks,
        };
    }


    async getVolunteerMostProductiveDay(
        volunteerId: string,
        currentUser: User,
        ): Promise<MostProductiveDayDto> {

        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== volunteerId) {
            throw new ForbiddenException('You can only view your own productivity data');
        }

        const volunteer = await this.userRepository.findOne({ where: { id: volunteerId } });
        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }


        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);


        const weeklyActivities = await this.activityLogRepository.find({
            where: {
            userId: volunteerId,
            createdAt: Between(currentWeekStart, currentWeekEnd),
            resource: In(['goal', 'progress_history']),
            action: In(['UPDATE_GOAL_PROGRESS', 'UPDATE_GOAL_STATUS', 'CREATE_GOAL', 'UPDATE_GOAL']),
            },
            order: { createdAt: 'ASC' },
        });

        // Also get progress history entries for historical pattern analysis
        const historicalData = await this.progressHistoryRepository.find({
            where: {
            volunteerId,
            weekStart: Between(
                new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                currentWeekEnd
            ),
            },
            relations: ['goal'],
            order: { createdAt: 'ASC' },
        });

        // Initialize daily productivity data
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dailyProductivity = daysOfWeek.map((dayName, index) => {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(currentWeekStart.getDate() + index);
            
            return {
            dayName,
            dayDate: dayDate.toISOString(),
            productivityScore: 0,
            activitiesCount: 0,
            averageProgress: 0,
            goalsWorkedOn: 0,
            };
        });

        // Analyze current week activities
        const goalProgressMap = new Map<string, { updates: number; totalProgress: number }>();
        const dailyGoalCounts = new Array(7).fill(0).map(() => new Set<string>());

        weeklyActivities.forEach(activity => {
            const activityDay = activity.createdAt.getDay();
            const dayData = dailyProductivity[activityDay];
            
            dayData.activitiesCount++;
            
            // Track unique goals worked on per day
            if (activity.resource === 'goal') {
                dailyGoalCounts[activityDay].add(activity.resourceId);
                
                // Calculate productivity score based on activity type and progress
                let activityScore = 1;
                
                if (activity.action === 'UPDATE_GOAL_PROGRESS') {
                    const progressChange = activity.details?.newProgress - (activity.details?.oldProgress || 0);
                    activityScore = Math.max(1, progressChange / 10);
                    
                    
                    const goalId = activity.resourceId;
                    const existing = goalProgressMap.get(goalId) || { updates: 0, totalProgress: 0 };
                    existing.updates++;
                    existing.totalProgress += (activity.details?.newProgress || 0);
                    goalProgressMap.set(goalId, existing);
                } else if (activity.action === 'UPDATE_GOAL_STATUS') {
                    if (activity.details?.newStatus === 'completed') {
                        activityScore = 10;
                    } else if (activity.details?.newStatus === 'in_progress') {
                        activityScore = 3;
                    }
                } else if (activity.action === 'CREATE_GOAL') {
                    activityScore = 2;
                }
                
                dayData.productivityScore += activityScore;
            }
        });

        dailyProductivity.forEach((dayData, index) => {
            dayData.goalsWorkedOn = dailyGoalCounts[index].size;
            
            const dayGoals = Array.from(dailyGoalCounts[index]);
            if (dayGoals.length > 0) {
                const totalProgress = dayGoals.reduce((sum, goalId) => {
                    const goalData = goalProgressMap.get(goalId);
                    return sum + (goalData ? goalData.totalProgress / goalData.updates : 0);
                }, 0);
                dayData.averageProgress = Math.round(totalProgress / dayGoals.length);
            }
            
            dayData.productivityScore = Math.min(100, Math.round(dayData.productivityScore * 2));
        });

        const mostProductiveDay = dailyProductivity.reduce((best, current) => {
            if (current.productivityScore > best.productivityScore) return current;
            if (current.productivityScore === best.productivityScore && current.activitiesCount > best.activitiesCount) return current;
            return best;
        }, dailyProductivity[0]);

        const historicalDayPatterns = new Array(7).fill(0).map(() => ({ totalScore: 0, count: 0 }));
        
        historicalData.forEach(entry => {
            const dayOfWeek = entry.createdAt.getDay();
            const progressScore = entry.progress / 10;
            const statusScore = entry.status === GoalStatus.COMPLETED ? 10 : 
                            entry.status === GoalStatus.IN_PROGRESS ? 5 : 1;
            
            historicalDayPatterns[dayOfWeek].totalScore += progressScore + statusScore;
            historicalDayPatterns[dayOfWeek].count++;
        });

        // Find historical best day pattern
        const historicalBestDay = historicalDayPatterns
            .map((pattern, index) => ({
                dayIndex: index,
                averageScore: pattern.count > 0 ? pattern.totalScore / pattern.count : 0,
            }))
            .reduce((best, current) => current.averageScore > best.averageScore ? current : best);

        // Generate insights
        const weekCompletion = Math.round((now.getDay() / 6) * 100);
        const totalWeekActivity = dailyProductivity.reduce((sum, day) => sum + day.activitiesCount, 0);
        
        let bestDayPattern = '';
        let recommendation = '';
        
        if (mostProductiveDay.productivityScore > 0) {
            bestDayPattern = `You're most productive on ${mostProductiveDay.dayName}s`;
            
            if (historicalBestDay.dayIndex === daysOfWeek.indexOf(mostProductiveDay.dayName)) {
                recommendation = `Great! You're consistent with your ${mostProductiveDay.dayName} productivity pattern.`;
            } else {
                recommendation = `Consider scheduling important tasks on ${daysOfWeek[historicalBestDay.dayIndex]}s based on your historical pattern.`;
            }
        } else {
            bestDayPattern = 'No significant activity detected this week';
            recommendation = 'Try to be more active with your goals to establish a productivity pattern.';
        }

        if (totalWeekActivity < 3 && weekCompletion > 50) {
            recommendation += ' Consider increasing your goal-related activities for better progress.';
        }

        return {
            volunteerId,
            volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
            currentWeek: {
                weekStart: currentWeekStart.toISOString(),
                weekEnd: currentWeekEnd.toISOString(),
            },
            mostProductiveDay: mostProductiveDay.productivityScore > 0 ? mostProductiveDay : null,
            weeklyProductivity: dailyProductivity,
            insights: {
                bestDayPattern,
                recommendation,
                weekCompletion,
            },
        };
    }



    private mapGoalStatus(status: GoalStatus): 'pending' | 'in-progress' | 'completed' | 'overdue' {
    switch (status) {
        case GoalStatus.PENDING:
        return 'pending';
        case GoalStatus.IN_PROGRESS:
        return 'in-progress';
        case GoalStatus.COMPLETED:
        return 'completed';
        case GoalStatus.OVERDUE:
        return 'overdue';
        default:
        return 'pending';
    }
    }

    private mapGoalPriority(priority?: GoalPriority): 'high' | 'medium' | 'low' {
    if (!priority) return 'medium';
    
    switch (priority) {
        case GoalPriority.HIGH:
        return 'high';
        case GoalPriority.MEDIUM:
        return 'medium';
        case GoalPriority.LOW:
        return 'low';
        default:
        return 'medium';
    }
    }


    private async applyFilters(
        queryBuilder: SelectQueryBuilder<ProgressHistory>,
        filters: ProgressHistoryFiltersDto,
    ): Promise<void> {
        if (filters.goalId) {
            queryBuilder.andWhere('ph.goalId = :goalId', { goalId: filters.goalId });
        }

        if (filters.status) {
            queryBuilder.andWhere('ph.status = :status', { status: filters.status });
        }

        if (filters.category) {
            queryBuilder.andWhere('goal.category = :category', { category: filters.category });
        }

        if (filters.search) {
            queryBuilder.andWhere(
            '(ph.title LIKE :search OR ph.notes LIKE :search OR goal.title LIKE :search)',
            { search: `%${filters.search}%` },
        );
        }

        if (filters.weekStartFrom) {
            queryBuilder.andWhere('ph.weekStart >= :weekStartFrom', {
            weekStartFrom: new Date(filters.weekStartFrom),
        });
        }

        if (filters.weekStartTo) {
            queryBuilder.andWhere('ph.weekStart <= :weekStartTo', {
            weekStartTo: new Date(filters.weekStartTo),
        });
        }

        if (filters.minProgress !== undefined) {
            queryBuilder.andWhere('ph.progress >= :minProgress', {
            minProgress: filters.minProgress,
        });
        }

        if (filters.maxProgress !== undefined) {
            queryBuilder.andWhere('ph.progress <= :maxProgress', {
            maxProgress: filters.maxProgress,
        });
        }
    }

    private mapToResponseDto(
        progressHistory: ProgressHistory,
        goal?: Goal,
        volunteer?: User,
    ): ProgressHistoryResponseDto {
        return new ProgressHistoryResponseDto({
        ...progressHistory,
        goalTitle: goal?.title,
        volunteerName: volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : undefined,
        category: goal?.category,
        });
    }

    private async logActivity(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        details?: Record<string, any>,
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
