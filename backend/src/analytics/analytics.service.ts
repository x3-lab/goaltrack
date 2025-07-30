import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Goal } from '../database/entities/goal.entity';
import { User } from '../database/entities/user.entity';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { GoalStatus } from '../database/enums/goals.enums';
import { UserRole } from '../database/enums/user.enums';
import { SystemOverviewDto } from './dto/system-overview.dto';
import { PersonalAnalyticsDto, AchievementDto, WeeklyTrendDto, CategoryStatDto, ProductiveDayDataDto } from './dto/personal-analytics.dto';
import { AnalyticsDataDto, CompletionTrendDto, PerformanceDistributionDto, CategoryBreakdownDto, VolunteerActivityDto } from './dto/analytics-data.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { VolunteerPerformanceDto } from './dto/volunteer-performance.dto';
import { AnalyticsFiltersDto, PersonalAnalyticsFiltersDto } from './dto/analytics-filters.dto';


Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ProgressHistory)
        private readonly progressHistoryRepository: Repository<ProgressHistory>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) {}

    async getSystemOverview(filters?: AnalyticsFiltersDto): Promise<SystemOverviewDto> {
        const dateRange = this.getDateRange(filters);

        const allUsers = await this.userRepository.find();
        const totalVolunteers = allUsers.length;
        const activeVolunteers = allUsers.filter(user => user.status === 'active').length;

        const goalQuery: any = {};
        if (dateRange.start && dateRange.end) {
            goalQuery.createdAt = Between(dateRange.start, dateRange.end);
        }

        const goals = await this.goalRepository.find({
            where: goalQuery,
            relations: ['volunteer'],
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        const overdueGoals = goals.filter(goal => goal.status === GoalStatus.OVERDUE).length;

        return {
            totalVolunteers,
            activeVolunteers,
            totalGoals,
            completedGoals,
            completionRate,
            overdueGoals,
        };
    }

    async getPersonalAnalytics(
        filters: PersonalAnalyticsFiltersDto,
        currentUser: User,
    ): Promise<PersonalAnalyticsDto> {
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== filters.volunteerId) {
            throw new ForbiddenException('You can only view your own analytics');
        }

        const volunteer = await this.userRepository.findOne({
            where: { id: filters.volunteerId },
        });
        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        const dateRange = this.getDateRange({
            start: filters.startDate,
            end: filters.endDate,
        });

        const goalQuery: any = { volunteerId: filters.volunteerId };
        if (dateRange.start && dateRange.end) {
            goalQuery.createdAt = Between(dateRange.start, dateRange.end);
        }

        const goals = await this.goalRepository.find({
            where: goalQuery,
            order: { createdAt: 'DESC' },
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
        const overallCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const averageProgress = totalGoals > 0 
            ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals)
            : 0;
        const performanceScore = Math.round((overallCompletionRate * 0.7) + (averageProgress * 0.3));

        const streakCount = await this.calculateStreakCount(filters.volunteerId);

        const weeklyTrends = await this.generateWeeklyTrends(filters.volunteerId);

        const achievements = await this.generateAchievements(filters.volunteerId, goals);

        const categoryStats = this.calculateCategoryStats(goals);

        const productiveData = await this.calculateProductiveDaysData(filters.volunteerId);

        return {
            overallCompletionRate,
            performanceScore,
            streakCount,
            weeklyTrends,
            achievements,
            categoryStats,
            productiveData,
        };
    }


    async getAnalyticsData(filters: AnalyticsFiltersDto): Promise<AnalyticsDataDto> {
        const dateRange = this.getDateRange(filters);

        const overview = await this.getSystemOverview(filters);

        const completionTrends = await this.generateCompletionTrends(dateRange);

        const performanceDistribution = await this.generatePerformanceDistribution();

        const categoryBreakdown = await this.generateCategoryBreakdown(dateRange);

        const volunteerActivity = await this.generateVolunteerActivity(dateRange);

        return {
            overview,
            completionTrends,
            performanceDistribution,
            categoryBreakdown,
            volunteerActivity,
        };
    }

    async getVolunteerPerformance(): Promise<VolunteerPerformanceDto[]> {
        const users = await this.userRepository.find({
            where: { role: UserRole.VOLUNTEER },
        });

        const performanceData = await Promise.all(
            users.map(async (user) => {
                const goals = await this.goalRepository.find({
                    where: { volunteerId: user.id },
                });

                const totalGoals = goals.length;
                const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
                const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
                const averageProgress = totalGoals > 0 
                    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals)
                    : 0;
                const performance = Math.round((completionRate * 0.7) + (averageProgress * 0.3));

                return {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    performance,
                    completionRate,
                    goalsCount: totalGoals,
                };
            })
        );

        return performanceData.sort((a, b) => b.performance - a.performance);
    }


    async exportReport(
        type: 'overview' | 'performance' | 'goals',
        filters?: AnalyticsFiltersDto,
    ): Promise<ExportReportDto> {
        let data: any;

        switch (type) {
        case 'overview':
            data = await this.getSystemOverview(filters);
            break;
        case 'performance':
            data = await this.getVolunteerPerformance();
            break;
        case 'goals':
            data = await this.getAnalyticsData(filters || {});
            break;
        default:
            data = await this.getSystemOverview(filters);
        }

        return {
            data,
        };
    }

    private getDateRange(filters?: { start?: string; end?: string }) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return {
            start: filters?.start ? new Date(filters.start) : thirtyDaysAgo,
            end: filters?.end ? new Date(filters.end) : now,
        };
    }

    private async calculateStreakCount(volunteerId: string): Promise<number> {
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const progressHistory = await this.progressHistoryRepository.find({
            where: {
                volunteerId,
                weekStart: Between(twelveWeeksAgo, new Date()),
            },
            order: { weekStart: 'DESC' },
        });

        let streak = 0;
        const weeklyMap = new Map<string, boolean>();

        progressHistory.forEach(entry => {
            const weekKey = entry.weekStart.toISOString().split('T')[0];
            if (entry.status === GoalStatus.COMPLETED) {
                weeklyMap.set(weekKey, true);
            }
        });

        const weeks = Array.from(weeklyMap.keys()).sort().reverse();
        for (const week of weeks) {
        if (weeklyMap.get(week)) {
            streak++;
        } else {
            break;
        }
        }

        return streak;
    }

    private async generateWeeklyTrends(volunteerId: string): Promise<WeeklyTrendDto[]> {
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const progressHistory = await this.progressHistoryRepository.find({
            where: {
                volunteerId,
                weekStart: Between(twelveWeeksAgo, new Date()),
            },
            order: { weekStart: 'ASC' },
        });

        const weeklyMap = new Map<string, typeof progressHistory>();
        progressHistory.forEach(entry => {
            const weekKey = entry.weekStart.toISOString().split('T')[0];
            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, []);
            }
            weeklyMap.get(weekKey)!.push(entry);
        });

        return Array.from(weeklyMap.entries()).map(([weekKey, entries]) => {
            const totalGoals = entries.length;
            const completedGoals = entries.filter(entry => entry.status === GoalStatus.COMPLETED).length;
            const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

            return {
                week: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                completionRate,
                goalsCompleted: completedGoals,
                totalGoals,
            };
        });
    }

    private async generateAchievements(volunteerId: string, goals: Goal[]): Promise<AchievementDto[]> {
        const achievements: AchievementDto[] = [];
        const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED);

        if (completedGoals.length >= 1) {
            achievements.push({
                id: '1',
                title: 'First Goal Completed',
                description: 'Completed your first goal!',
                earnedDate: completedGoals[0].updatedAt.toISOString(),
                icon: '🎯',
            });
        }

        if (completedGoals.length >= 5) {
            achievements.push({
                id: '2',
                title: 'Goal Achiever',
                description: 'Completed 5 goals',
                earnedDate: completedGoals[4].updatedAt.toISOString(),
                icon: '⭐',
            });
        }

        if (completedGoals.length >= 10) {
            achievements.push({
                id: '3',
                title: 'Goal Master',
                description: 'Completed 10 goals',
                earnedDate: completedGoals[9].updatedAt.toISOString(),
                icon: '🏆',
            });
        }

        const streakCount = await this.calculateStreakCount(volunteerId);
        if (streakCount >= 1) {
            achievements.push({
                id: '4',
                title: 'Perfect Week',
                description: 'Completed all goals in a week',
                earnedDate: new Date().toISOString(),
                icon: '🔥',
            });
        }

        return achievements;
    }

    private calculateCategoryStats(goals: Goal[]): CategoryStatDto[] {
        const categoryMap = new Map<string, { total: number; completed: number }>();

        goals.forEach(goal => {
            const category = goal.category || 'Uncategorized';
            const existing = categoryMap.get(category) || { total: 0, completed: 0 };
            existing.total++;
            if (goal.status === GoalStatus.COMPLETED) {
                existing.completed++;
            }
            categoryMap.set(category, existing);
        });

        return Array.from(categoryMap.entries())
            .map(([category, stats]) => ({
                category,
                completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                totalGoals: stats.total,
            }))
            .sort((a, b) => b.totalGoals - a.totalGoals);
    }

    private async calculateProductiveDaysData(volunteerId: string): Promise<ProductiveDayDataDto[]> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activities = await this.activityLogRepository.find({
            where: {
                userId: volunteerId,
                action: 'UPDATE_GOAL_STATUS',
                createdAt: Between(thirtyDaysAgo, new Date()),
                details: { newStatus: GoalStatus.COMPLETED } as any,
            },
        });

        const dayMap = new Map<string, number>();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        daysOfWeek.forEach(day => dayMap.set(day, 0));

        activities.forEach(activity => {
            const dayOfWeek = daysOfWeek[activity.createdAt.getDay()];
            dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + 1);
        });

        return Array.from(dayMap.entries()).map(([day, completedGoals]) => ({
            day,
            completedGoals,
        }));
    }

    private async generateCompletionTrends(dateRange: { start: Date; end: Date }): Promise<{
        daily: CompletionTrendDto[];
        weekly: CompletionTrendDto[];
    }> {
        const goals = await this.goalRepository.find({
            where: {
                createdAt: Between(dateRange.start, dateRange.end),
            },
        });

        const daily = this.generateDailyTrends(goals, dateRange);

        const weekly = this.generateWeeklyTrendsData(goals, dateRange);

        return { daily, weekly };
    }

    private generateDailyTrends(goals: Goal[], dateRange: { start: Date; end: Date }): CompletionTrendDto[] {
        const trends: CompletionTrendDto[] = [];
        const totalDays = Math.min(
        Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)),
        30
        );

        for (let i = totalDays - 1; i >= 0; i--) {
            const date = new Date(dateRange.end);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayGoals = goals.filter(goal =>
                goal.createdAt >= dayStart && goal.createdAt <= dayEnd
            );
            const completedGoals = dayGoals.filter(goal => goal.status === GoalStatus.COMPLETED);

            trends.push({
                date: date.toISOString().split('T')[0],
                completed: completedGoals.length,
                total: dayGoals.length,
                period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            });
        }

        return trends;
    }

    private generateWeeklyTrendsData(goals: Goal[], dateRange: { start: Date; end: Date }): CompletionTrendDto[] {
        const trends: CompletionTrendDto[] = [];
        const totalWeeks = Math.min(
        Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 7)),
        12
        );

        for (let i = totalWeeks - 1; i >= 0; i--) {
            const weekEnd = new Date(dateRange.end);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);

            const weekGoals = goals.filter(goal =>
                goal.createdAt >= weekStart && goal.createdAt <= weekEnd
            );
            const completedGoals = weekGoals.filter(goal => goal.status === GoalStatus.COMPLETED);

            trends.push({
                date: weekStart.toISOString().split('T')[0],
                completed: completedGoals.length,
                total: weekGoals.length,
                period: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            });
        }

        return trends;
    }

    private async generatePerformanceDistribution(): Promise<PerformanceDistributionDto[]> {
        const users = await this.userRepository.find({
            where: { role: UserRole.VOLUNTEER },
        });

        const distribution = {
            'High Performers (80-100%)': 0,
            'Good Performers (60-79%)': 0,
            'Average Performers (40-59%)': 0,
            'Needs Improvement (0-39%)': 0,
        };

        for (const user of users) {
            const goals = await this.goalRepository.find({
                where: { volunteerId: user.id },
            });

            const completionRate = goals.length > 0 
                ? (goals.filter(goal => goal.status === GoalStatus.COMPLETED).length / goals.length) * 100
                : 0;

            if (completionRate >= 80) {
                distribution['High Performers (80-100%)']++;
            } else if (completionRate >= 60) {
                distribution['Good Performers (60-79%)']++;
            } else if (completionRate >= 40) {
                distribution['Average Performers (40-59%)']++;
            } else {
                distribution['Needs Improvement (0-39%)']++;
            }
        }

        return Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
        }));
    }


    private async generateCategoryBreakdown(dateRange: { start: Date; end: Date }): Promise<CategoryBreakdownDto[]> {
        const goals = await this.goalRepository.find({
            where: {
                createdAt: Between(dateRange.start, dateRange.end),
            },
        });

        const categoryMap = new Map<string, number>();
        goals.forEach(goal => {
            const category = goal.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }

    private async generateVolunteerActivity(dateRange: { start: Date; end: Date }): Promise<VolunteerActivityDto[]> {
        const users = await this.userRepository.find({
            where: { role: UserRole.VOLUNTEER },
        });

        const activityData = await Promise.all(
            users.map(async (user) => {
                const goals = await this.goalRepository.find({
                    where: {
                        volunteerId: user.id,
                        createdAt: Between(dateRange.start, dateRange.end),
                    },
                });

                const totalGoals = goals.length;
                const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;
                const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

                return {
                    name: `${user.firstName} ${user.lastName}`,
                    totalGoals,
                    completedGoals,
                    completionRate,
                };
            })
        );

        return activityData
            .filter(data => data.totalGoals > 0)
            .sort((a, b) => b.completionRate - a.completionRate);
    }
}
