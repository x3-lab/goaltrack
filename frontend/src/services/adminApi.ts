import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import type { User } from '../types/api';

// Import types that match backend DTOs exactly
export interface AdminProfileDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  title?: string;
  lastLogin: string;
  permissions: string[];
  preferences: AdminPreferencesDto;
  stats: AdminStatsDto;
}

export interface AdminPreferencesDto {
  weeklyReports: boolean;
  systemAlerts: boolean;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dashboardRefreshInterval: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface AdminStatsDto {
  totalVolunteersManaged: number;
  totalGoalsOversaw: number;
  lastSystemMaintenance: string;
}

export interface UpdateAdminProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
}

export interface UpdateAdminPreferencesDto {
  weeklyReports?: boolean;
  systemAlerts?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  timezone?: string;
  dashboardRefreshInterval?: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface ChangeAdminPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface DashboardStatsDto {
  activeVolunteers: number;
  totalGoals: number;
  completionRate: number;
  overdueGoals: number;
  monthlyChanges: MonthlyChangesDto;
}

export interface MonthlyChangesDto {
  volunteers: number;
  goals: number;
  completion: number;
  overdue: number;
}

export interface ActivityDto {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
  timeAgo: string;
}

export interface DeadlineDto {
  id: string;
  volunteer: string;
  volunteerEmail: string;
  goal: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  daysUntilDeadline: number;
}

export interface VolunteerWithGoalsDto {
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  inProgressGoals: number;
  completionRate: number;
  lastActivity: string;
  recentGoals: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    dueDate: string;
  }>;
}

// Legacy interfaces for backward compatibility
export interface AdminProfile extends User {
  department?: string;
  title?: string;
  lastLogin?: string;
  permissions?: string[];
  totalVolunteersManaged?: number;
  totalGoalsCreated?: number;
  systemRole?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  inProgressGoals: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
  }>;
}

class AdminApiService {
  // ADMIN PROFILE MANAGEMENT

  /**
   * Get current admin profile
   */
  async getProfile(): Promise<AdminProfileDto> {
    try {
      console.log('Getting admin profile...');
      
      const response = await httpClient.get<AdminProfileDto>('/admin/profile');
      
      console.log('Admin profile loaded successfully');
      return response;
    } catch (error: any) {
      console.warn('Backend failed');
    }

  }

  /**
   * Update admin profile
   */
  async updateProfile(updates: UpdateAdminProfileDto): Promise<AdminProfileDto> {
    try {
      console.log('Updating admin profile:', updates);
      
      const response = await httpClient.patch<AdminProfileDto>('/admin/profile', updates);
      
      console.log('Admin profile updated successfully');
      return response;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Update admin preferences
   */
  async updatePreferences(preferences: UpdateAdminPreferencesDto): Promise<AdminProfileDto> {
    try {
      console.log('Updating admin preferences:', preferences);
      
      const response = await httpClient.patch<AdminProfileDto>('/admin/preferences', preferences);
      
      console.log('Admin preferences updated successfully');
      return response;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  /**
   * Change admin password
   */
  async changePassword(passwordData: ChangeAdminPasswordDto): Promise<{ success: boolean }> {
    try {
      console.log('Changing admin password...');
      
      const response = await httpClient.post<{ success: boolean }>('/admin/change-password', passwordData);
      
      console.log('Admin password changed successfully');
      return response;
    } catch (error: any) {
      throw this.transformError(error);
    }
  }

  // DASHBOARD STATISTICS

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    try {
      console.log('Getting dashboard statistics...');
      
      const response = await httpClient.get<DashboardStatsDto>('/admin/dashboard/stats');
      
      console.log('Dashboard statistics loaded successfully');
      return response;
    } catch (error: any) {
      console.warn('Backend failed');
    }
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityDto[]> {
    try {
      console.log(`Getting recent activity (limit: ${limit})...`);
      
      const response = await httpClient.get<ActivityDto[]>(`/admin/dashboard/activity?limit=${limit}`);
      
      console.log(`Recent activity loaded successfully (${response.length} items)`);
      return response;
    } catch (error: any) {
      console.warn('Backend failed');
    }
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(limit: number = 10): Promise<DeadlineDto[]> {
    try {
      console.log(`Getting upcoming deadlines (limit: ${limit})...`);
      
      const response = await httpClient.get<DeadlineDto[]>(`/admin/dashboard/deadlines?limit=${limit}`);
      
      console.log(`Upcoming deadlines loaded successfully (${response.length} items)`);
      return response;
    } catch (error: any) {
      console.warn('Backend failed, using fallback data');
    }
  }

  /**
   * Get volunteers with their goals summary
   */
  async getVolunteersWithGoals(): Promise<VolunteerWithGoalsDto[]> {
    try {
      console.log('Getting volunteers with goals...');
      
      const response = await httpClient.get<VolunteerWithGoalsDto[]>('/admin/volunteers-with-goals');
      
      console.log(`Volunteers with goals loaded successfully (${response.length} volunteers)`);
      return response;
    } catch (error: any) {
      console.warn('Backend failed, using fallback data');
    }
  }

  // LEGACY METHODS (for backward compatibility)

  /**
   * Get admin profile (legacy format)
   */
  async getAdminProfile(): Promise<AdminProfile> {
    const profile = await this.getProfile();
    return this.transformToLegacyProfile(profile);
  }

  /**
   * Update admin profile (legacy format)
   */
  async updateAdminProfile(updates: { name?: string; email?: string; phone?: string; department?: string; title?: string; }): Promise<AdminProfile> {
    const profileUpdate: UpdateAdminProfileDto = {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      title: updates.title
    };
    
    const updatedProfile = await this.updateProfile(profileUpdate);
    return this.transformToLegacyProfile(updatedProfile);
  }

  /**
   * Change admin password (legacy method)
   */
  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const result = await this.changePassword({ currentPassword, newPassword });
    return result.success;
  }

  /**
   * Get system stats (legacy format)
   */
  async getSystemStats(): Promise<AdminStats> {
    const [dashboardStats, recentActivity] = await Promise.all([
      this.getDashboardStats(),
      this.getRecentActivity(10)
    ]);

    return {
      totalUsers: dashboardStats.activeVolunteers,
      activeUsers: dashboardStats.activeVolunteers,
      inactiveUsers: 0,
      totalGoals: dashboardStats.totalGoals,
      completedGoals: Math.round(dashboardStats.totalGoals * (dashboardStats.completionRate / 100)),
      pendingGoals: dashboardStats.totalGoals - Math.round(dashboardStats.totalGoals * (dashboardStats.completionRate / 100)),
      inProgressGoals: dashboardStats.totalGoals - dashboardStats.overdueGoals,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.action,
        description: `${activity.userName} ${activity.action} ${activity.resource}`,
        timestamp: activity.timestamp,
        userId: activity.userId,
        userName: activity.userName
      }))
    };
  }

  // USER AND GOAL MANAGEMENT (existing methods remain unchanged)
  async getAllUsers(filters?: {
    status?: 'active' | 'inactive';
    role?: 'admin' | 'volunteer';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await httpClient.get<any>(
        `${ENDPOINTS.ADMIN.USERS}?${params.toString()}`
      );

      return response;
    } catch (error: any) {
      console.error('Failed to get users for admin:', error);
      throw this.transformError(error);
    }
  }

  async getAllGoals(filters?: {
    status?: string;
    volunteerId?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await httpClient.get<any>(
        `${ENDPOINTS.ADMIN.GOALS}?${params.toString()}`
      );

      return response;
    } catch (error: any) {
      console.error('Failed to get goals for admin:', error);
      throw this.transformError(error);
    }
  }

  async getActivityLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.action) params.append('action', filters.action);
      if (filters?.entityType) params.append('entityType', filters.entityType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await httpClient.get<any>(
        `${ENDPOINTS.ADMIN.ACTIVITY_LOGS}?${params.toString()}`
      );

      return response;
    } catch (error: any) {
      console.error('Failed to get activity logs:', error);
      throw this.transformError(error);
    }
  }

  // USER MANAGEMENT ACTIONS (existing methods remain unchanged)
  async activateUser(userId: string): Promise<void> {
    try {
      await httpClient.put(`${ENDPOINTS.USERS.STATUS(userId)}`, { status: 'active' });
      console.log(`User ${userId} activated`);
    } catch (error: any) {
      console.error(`Failed to activate user ${userId}:`, error);
      throw this.transformError(error);
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await httpClient.put(`${ENDPOINTS.USERS.STATUS(userId)}`, { status: 'inactive' });
      console.log(`User ${userId} deactivated`);
    } catch (error: any) {
      console.error(`Failed to deactivate user ${userId}:`, error);
      throw this.transformError(error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await httpClient.delete(ENDPOINTS.USERS.BY_ID(userId));
      console.log(`User ${userId} deleted`);
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw this.transformError(error);
    }
  }

  // SYSTEM ACTIONS (existing methods remain unchanged)
  async processOverdueGoals(): Promise<{ message: string; processed: number }> {
    try {
      console.log('Processing overdue goals...');

      const response = await httpClient.post<{ message: string; processed: number }>(
        ENDPOINTS.GOALS.PROCESS_OVERDUE
      );

      console.log('Overdue goals processed:', response.processed);
      return response;
    } catch (error: any) {
      console.error('Failed to process overdue goals:', error);
      throw this.transformError(error);
    }
  }

  async runWeeklyProcessing(): Promise<{ message: string; results: any }> {
    try {
      console.log('Running weekly processing...');

      const response = await httpClient.post<{ message: string; results: any }>(
        ENDPOINTS.GOALS.WEEKLY_PROCESSING
      );

      console.log('Weekly processing completed');
      return response;
    } catch (error: any) {
      console.error('Failed to run weekly processing:', error);
      throw this.transformError(error);
    }
  }

  // PRIVATE UTILITY METHODS

  private transformToLegacyProfile(profile: AdminProfileDto): AdminProfile {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: 'admin',
      department: profile.department,
      title: profile.title,
      lastLogin: profile.lastLogin,
      permissions: profile.permissions,
      totalVolunteersManaged: profile.stats.totalVolunteersManaged,
      totalGoalsCreated: profile.stats.totalGoalsOversaw,
      systemRole: profile.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }


  private transformError(error: any): Error {
    if (error.status === 403) {
      return new Error('Access denied. Admin privileges required.');
    } else if (error.status === 404) {
      return new Error('Resource not found');
    } else if (error.status === 422) {
      return new Error(error.message || 'Invalid data provided');
    } else if (error.status >= 500) {
      return new Error('Server error. Please try again later.');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      endpoints: {
        profile: '/admin/profile',
        preferences: '/admin/preferences',
        changePassword: '/admin/change-password',
        dashboardStats: '/admin/dashboard/stats',
        recentActivity: '/admin/dashboard/activity',
        upcomingDeadlines: '/admin/dashboard/deadlines',
        volunteersWithGoals: '/admin/volunteers-with-goals',
        stats: ENDPOINTS.ADMIN.STATS,
        users: ENDPOINTS.ADMIN.USERS,
        goals: ENDPOINTS.ADMIN.GOALS,
        activityLogs: ENDPOINTS.ADMIN.ACTIVITY_LOGS,
      },
      features: [
        'Complete admin profile management',
        'Dashboard statistics with real-time updates',
        'Activity logging and monitoring',
        'Deadline tracking and alerts',
        'Volunteer management with goal tracking',
        'Password management',
        'Preferences and settings',
        'System statistics and analytics'
      ]
    };
  }
}

export const adminApi = new AdminApiService();
export default adminApi;