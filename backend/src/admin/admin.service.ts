// src/admin/admin.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Goal } from '../database/entities/goal.entity';
import { ActivityLog } from '../database/entities/activity-log.entity';
import { ProgressHistory } from '../database/entities/progress-history.entity';
import { GoalStatus } from '../database/enums/goals.enums';
import { UserRole } from '../database/enums/user.enums';
import { AdminProfileDto, UpdateAdminProfileDto, UpdateAdminPreferencesDto } from './dto/admin-profile.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { ActivityDto, DeadlineDto } from './dto/dashboard-activity.dto';
import { VolunteerWithGoalsDto } from './dto/volunteers-with-goals.dto';
import { ChangeAdminPasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
        @InjectRepository(ProgressHistory)
        private readonly progressHistoryRepository: Repository<ProgressHistory>,
    ) {}

    async getProfile(adminId: string): Promise<AdminProfileDto> {
        const admin = await this.userRepository.findOne({
        where: { id: adminId, role: UserRole.ADMIN },
        });

        if (!admin) {
        throw new NotFoundException('Admin profile not found');
        }

        const volunteers = await this.userRepository.find({
        where: { role: UserRole.VOLUNTEER },
        });

        const goals = await this.goalRepository.find();

        const preferences = {
            weeklyReports: admin.preferences?.weeklyReports ?? true,
            systemAlerts: admin.preferences?.systemAlerts ?? true,
            theme: admin.preferences?.theme ?? 'light' as const,
            timezone: admin.preferences?.timezone ?? 'UTC',
        };


        return {
            id: admin.id,
            name: `${admin.firstName} ${admin.lastName}`,
            email: admin.email,
            phone: admin.phoneNumber || '',
            role: 'admin',
            joinDate: admin.createdAt.toISOString(),
            lastLogin: admin.lastLogin?.toISOString() || admin.updatedAt.toISOString(),
            title: admin.position || 'System Administrator',
            permissions: this.getAdminPermissions(),
            preferences,
            stats: {
                totalVolunteersManaged: volunteers.length,
                totalGoalsOversaw: goals.length,
                lastSystemMaintenance: new Date().toISOString(),
            },
        };
    }

    async updateProfile(adminId: string, updateData: UpdateAdminProfileDto): Promise<AdminProfileDto> {
        const admin = await this.userRepository.findOne({
        where: { id: adminId, role: UserRole.ADMIN },
        });

        if (!admin) {
        throw new NotFoundException('Admin profile not found');
        }

        // Update admin fields
        if (updateData.name) {
        const [firstName, ...lastNameParts] = updateData.name.split(' ');
        admin.firstName = firstName;
        admin.lastName = lastNameParts.join(' ') || '';
        }

        if (updateData.email) admin.email = updateData.email;
        if (updateData.phone) admin.phoneNumber = updateData.phone;
        if (updateData.title) admin.position = updateData.title;

        admin.updatedAt = new Date();

        await this.userRepository.save(admin);

        // Log the activity
        await this.logActivity(adminId, 'UPDATE_ADMIN_PROFILE', 'user', adminId, {
        updates: updateData,
        });

        return this.getProfile(adminId);
    }

    async updatePreferences(
        adminId: string,
        preferencesData: UpdateAdminPreferencesDto,
    ): Promise<AdminProfileDto> {
        const admin = await this.userRepository.findOne({
        where: { id: adminId, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException('Admin profile not found');
        }

        const currentPreferences = admin.preferences || {};
        admin.preferences = {
            ...currentPreferences,
            ...preferencesData,
        };

        admin.updatedAt = new Date();
        await this.userRepository.save(admin);

        await this.logActivity(adminId, 'UPDATE_ADMIN_PREFERENCES', 'user', adminId, {
            preferences: preferencesData,
        });

        return this.getProfile(adminId);
    }

    async changePassword(adminId: string, changePasswordData: ChangeAdminPasswordDto): Promise<boolean> {
        const admin = await this.userRepository.findOne({
            where: { id: adminId, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException('Admin profile not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            changePasswordData.currentPassword,
            admin.password,
        );

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(changePasswordData.newPassword, saltRounds);

        admin.password = hashedNewPassword;
        admin.updatedAt = new Date();
        await this.userRepository.save(admin);

        await this.logActivity(adminId, 'CHANGE_ADMIN_PASSWORD', 'user', adminId, {
            timestamp: new Date().toISOString(),
        });

        return true;
    }

    async getDashboardStats(): Promise<DashboardStatsDto> {
        const volunteers = await this.userRepository.find({
            where: { role: UserRole.VOLUNTEER },
        });

        const goals = await this.goalRepository.find();

        const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.status === GoalStatus.COMPLETED).length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        const overdueGoals = goals.filter(g => g.status === GoalStatus.OVERDUE).length;

        const monthlyChanges = await this.calculateMonthlyChanges();

        return {
            activeVolunteers,
            totalGoals,
            completionRate,
            overdueGoals,
            monthlyChanges,
        };
    }

    async getRecentActivity(limit: number = 10): Promise<ActivityDto[]> {
        const activities = await this.activityLogRepository.find({
                relations: ['user'],
                order: { createdAt: 'DESC' },
                take: limit,
            });

        return activities.map(activity => {
            let actionText = 'performed an action on';
            let goalTitle = 'Unknown Goal';

            switch (activity.action) {
                case 'UPDATE_GOAL_PROGRESS':
                actionText = 'updated progress on';
                break;
                case 'UPDATE_GOAL_STATUS':
                if (activity.details?.newStatus === 'completed') {
                    actionText = 'completed';
                } else if (activity.details?.newStatus === 'in_progress') {
                    actionText = 'started working on';
                } else {
                    actionText = 'updated status of';
                }
                break;
                case 'CREATE_GOAL':
                actionText = 'created';
                break;
                case 'UPDATE_GOAL':
                actionText = 'updated';
                break;
                default:
                actionText = 'performed an action on';
            }

            if (activity.details?.goalTitle) {
                goalTitle = activity.details.goalTitle;
            } else if (activity.details?.title) {
                goalTitle = activity.details.title;
            }

            const timeAgo = this.getTimeAgo(activity.createdAt);

            return {
                id: activity.id,
                user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
                action: actionText,
                goal: goalTitle,
                time: timeAgo,
                timestamp: activity.createdAt.toISOString(),
            };
        });
    }

    async getUpcomingDeadlines(limit: number = 10): Promise<DeadlineDto[]> {
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        const goals = await this.goalRepository.find({
            where: {
                dueDate: Between(now, twoWeeksFromNow),
                status: In([GoalStatus.PENDING, GoalStatus.IN_PROGRESS]),
            },
            relations: ['volunteer'],
            order: { dueDate: 'ASC' },
            take: limit,
        });

        return goals.map(goal => ({
            id: goal.id,
            volunteer: goal.volunteer ? `${goal.volunteer.firstName} ${goal.volunteer.lastName}` : 'Unknown',
            volunteerEmail: goal.volunteer?.email || '',
            goal: goal.title,
            deadline: goal.dueDate.toISOString().split('T')[0],
            priority: goal.priority?.toLowerCase() as 'high' | 'medium' | 'low' || 'medium',
            status: goal.status.toLowerCase() as 'pending' | 'in-progress' | 'completed',
        }));
    }

    async getVolunteersWithGoals(): Promise<VolunteerWithGoalsDto[]> {
        const volunteers = await this.userRepository.find({
            where: { role: UserRole.VOLUNTEER },
            order: { createdAt: 'DESC' },
        });

        const volunteersWithGoals = await Promise.all(
        volunteers.map(async (volunteer) => {
            const goals = await this.goalRepository.find({
                where: { volunteerId: volunteer.id },
            });

            const goalsCount = goals.length;
            const completedGoalsCount = goals.filter(g => g.status === GoalStatus.COMPLETED).length;
            const completionRate = goalsCount > 0 ? Math.round((completedGoalsCount / goalsCount) * 100) : 0;

            let performance: 'high' | 'medium' | 'low' = 'low';
            if (completionRate >= 80) performance = 'high';
            else if (completionRate >= 60) performance = 'medium';

            return {
                id: volunteer.id,
                name: `${volunteer.firstName} ${volunteer.lastName}`,
                email: volunteer.email,
                status: volunteer.status as 'active' | 'inactive',
                role: volunteer.role,
                joinDate: volunteer.createdAt.toISOString(),
                lastActive: volunteer.lastLogin?.toISOString() || volunteer.updatedAt.toISOString(),
                performance,
                goalsCount,
                completedGoalsCount,
                completionRate,
            };
        })
        );

        return volunteersWithGoals;
    }


    private getAdminPermissions(): string[] {
        return [
            'manage_users',
            'manage_goals',
            'view_analytics',
            'manage_settings',
            'export_data',
            'send_notifications',
            'manage_templates',
            'system_administration',
        ];
    }

    private async calculateMonthlyChanges() {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const thisMonthVolunteers = await this.userRepository.count({
            where: {
                role: UserRole.VOLUNTEER,
                createdAt: Between(startOfThisMonth, now),
            },
        });

        const thisMonthGoals = await this.goalRepository.count({
            where: {
                createdAt: Between(startOfThisMonth, now),
            },
        });

        const lastMonthVolunteers = await this.userRepository.count({
            where: {
                role: UserRole.VOLUNTEER,
                createdAt: Between(startOfLastMonth, endOfLastMonth),
            },
        });

        const lastMonthGoals = await this.goalRepository.count({
            where: {
                createdAt: Between(startOfLastMonth, endOfLastMonth),
            },
        });

        const thisMonthCompletedGoals = await this.goalRepository.count({
            where: {
                status: GoalStatus.COMPLETED,
                updatedAt: Between(startOfThisMonth, now),
            },
        });

        const lastMonthCompletedGoals = await this.goalRepository.count({
            where: {
                status: GoalStatus.COMPLETED,
                updatedAt: Between(startOfLastMonth, endOfLastMonth),
            },
        });

        const thisMonthCompletionRate = thisMonthGoals > 0 ? (thisMonthCompletedGoals / thisMonthGoals) * 100 : 0;
        const lastMonthCompletionRate = lastMonthGoals > 0 ? (lastMonthCompletedGoals / lastMonthGoals) * 100 : 0;

        const thisMonthOverdue = await this.goalRepository.count({
            where: {
                status: GoalStatus.OVERDUE,
                updatedAt: Between(startOfThisMonth, now),
            },
        });

        const lastMonthOverdue = await this.goalRepository.count({
            where: {
                status: GoalStatus.OVERDUE,
                updatedAt: Between(startOfLastMonth, endOfLastMonth),
            },
        });

        return {
            volunteers: thisMonthVolunteers - lastMonthVolunteers,
            goals: thisMonthGoals - lastMonthGoals,
            completion: Math.round(thisMonthCompletionRate - lastMonthCompletionRate),
            overdue: thisMonthOverdue - lastMonthOverdue,
        };
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString();
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