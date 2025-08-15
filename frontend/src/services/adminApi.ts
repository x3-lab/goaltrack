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
  private isOnline = false;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await httpClient.get('/admin/profile');
      this.isOnline = true;
      console.log('✅ Admin API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('🔄 Admin API using fallback mode');
    }
  }

  // ADMIN PROFILE MANAGEMENT

  /**
   * Get current admin profile
   */
  async getProfile(): Promise<AdminProfileDto> {
    if (this.isOnline) {
      try {
        console.log('👨‍💼 Getting admin profile...');
        
        const response = await httpClient.get<AdminProfileDto>('/admin/profile');
        
        console.log('✅ Admin profile loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getProfileFallback();
  }

  /**
   * Update admin profile
   */
  async updateProfile(updates: UpdateAdminProfileDto): Promise<AdminProfileDto> {
    if (this.isOnline) {
      try {
        console.log('👨‍💼 Updating admin profile:', updates);
        
        const response = await httpClient.patch<AdminProfileDto>('/admin/profile', updates);
        
        console.log('✅ Admin profile updated successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback
    return this.updateProfileFallback(updates);
  }

  /**
   * Update admin preferences
   */
  async updatePreferences(preferences: UpdateAdminPreferencesDto): Promise<AdminProfileDto> {
    if (this.isOnline) {
      try {
        console.log('⚙️ Updating admin preferences:', preferences);
        
        const response = await httpClient.patch<AdminProfileDto>('/admin/preferences', preferences);
        
        console.log('✅ Admin preferences updated successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback
    return this.updatePreferencesFallback(preferences);
  }

  /**
   * Change admin password
   */
  async changePassword(passwordData: ChangeAdminPasswordDto): Promise<{ success: boolean }> {
    if (this.isOnline) {
      try {
        console.log('🔒 Changing admin password...');
        
        const response = await httpClient.post<{ success: boolean }>('/admin/change-password', passwordData);
        
        console.log('✅ Admin password changed successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback - simulate password change
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }

  // DASHBOARD STATISTICS

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    if (this.isOnline) {
      try {
        console.log('📊 Getting dashboard statistics...');
        
        const response = await httpClient.get<DashboardStatsDto>('/admin/dashboard/stats');
        
        console.log('✅ Dashboard statistics loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getDashboardStatsFallback();
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityDto[]> {
    if (this.isOnline) {
      try {
        console.log(`📋 Getting recent activity (limit: ${limit})...`);
        
        const response = await httpClient.get<ActivityDto[]>(`/admin/dashboard/activity?limit=${limit}`);
        
        console.log(`✅ Recent activity loaded successfully (${response.length} items)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getRecentActivityFallback(limit);
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(limit: number = 10): Promise<DeadlineDto[]> {
    if (this.isOnline) {
      try {
        console.log(`⏰ Getting upcoming deadlines (limit: ${limit})...`);
        
        const response = await httpClient.get<DeadlineDto[]>(`/admin/dashboard/deadlines?limit=${limit}`);
        
        console.log(`✅ Upcoming deadlines loaded successfully (${response.length} items)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getUpcomingDeadlinesFallback(limit);
  }

  /**
   * Get volunteers with their goals summary
   */
  async getVolunteersWithGoals(): Promise<VolunteerWithGoalsDto[]> {
    if (this.isOnline) {
      try {
        console.log('👥 Getting volunteers with goals...');
        
        const response = await httpClient.get<VolunteerWithGoalsDto[]>('/admin/volunteers-with-goals');
        
        console.log(`✅ Volunteers with goals loaded successfully (${response.length} volunteers)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getVolunteersWithGoalsFallback();
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

  // FALLBACK METHODS (Local Data Simulation)

  private async getProfileFallback(): Promise<AdminProfileDto> {
    const stored = localStorage.getItem('adminProfile');
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultProfile: AdminProfileDto = {
      id: 'admin-1',
      name: 'John Administrator',
      email: 'admin@x3lab.com',
      phone: '+1234567890',
      role: 'admin',
      department: 'Administration',
      title: 'System Administrator',
      lastLogin: new Date().toISOString(),
      permissions: this.getAdminPermissions('admin'),
      preferences: {
        weeklyReports: true,
        systemAlerts: true,
        theme: 'light',
        timezone: 'UTC',
        dashboardRefreshInterval: 60,
        emailNotifications: true,
        smsNotifications: false
      },
      stats: {
        totalVolunteersManaged: 25,
        totalGoalsOversaw: 150,
        lastSystemMaintenance: new Date().toISOString()
      }
    };

    localStorage.setItem('adminProfile', JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  private async updateProfileFallback(updates: UpdateAdminProfileDto): Promise<AdminProfileDto> {
    const currentProfile = await this.getProfileFallback();
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));
    return updatedProfile;
  }

  private async updatePreferencesFallback(preferences: UpdateAdminPreferencesDto): Promise<AdminProfileDto> {
    const currentProfile = await this.getProfileFallback();
    const updatedProfile = {
      ...currentProfile,
      preferences: {
        ...currentProfile.preferences,
        ...preferences
      }
    };
    
    localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));
    return updatedProfile;
  }

  private async getDashboardStatsFallback(): Promise<DashboardStatsDto> {
    const stored = localStorage.getItem('dashboardStats');
    if (stored) {
      const stats = JSON.parse(stored);
      // Check if data is recent (within last hour)
      if (Date.now() - new Date(stats.lastUpdated).getTime() < 3600000) {
        return stats.data;
      }
    }

    // Generate mock data
    const mockStats: DashboardStatsDto = {
      activeVolunteers: 25,
      totalGoals: 150,
      completionRate: 78,
      overdueGoals: 8,
      monthlyChanges: {
        volunteers: 3,
        goals: 12,
        completion: 5,
        overdue: -2
      }
    };

    localStorage.setItem('dashboardStats', JSON.stringify({
      data: mockStats,
      lastUpdated: new Date().toISOString()
    }));

    return mockStats;
  }

  private async getRecentActivityFallback(limit: number): Promise<ActivityDto[]> {
    const stored = localStorage.getItem('recentActivity');
    if (stored) {
      const activities = JSON.parse(stored);
      return activities.slice(0, limit);
    }

    // Generate mock activity
    const mockActivities: ActivityDto[] = [
      {
        id: '1',
        userId: 'user-1',
        userName: 'Sarah Johnson',
        action: 'completed',
        resource: 'goal',
        resourceId: 'goal-1',
        details: { goalTitle: 'First Aid Training' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        timeAgo: '2 hours ago'
      },
      {
        id: '2',
        userId: 'user-2',
        userName: 'Mike Chen',
        action: 'started',
        resource: 'goal',
        resourceId: 'goal-2',
        details: { goalTitle: 'Community Outreach' },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        timeAgo: '4 hours ago'
      },
      {
        id: '3',
        userId: 'user-3',
        userName: 'Emma Davis',
        action: 'updated progress on',
        resource: 'goal',
        resourceId: 'goal-3',
        details: { goalTitle: 'Fundraising Event', progress: 65 },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        timeAgo: '6 hours ago'
      }
    ];

    localStorage.setItem('recentActivity', JSON.stringify(mockActivities));
    return mockActivities.slice(0, limit);
  }

  private async getUpcomingDeadlinesFallback(limit: number): Promise<DeadlineDto[]> {
    const stored = localStorage.getItem('upcomingDeadlines');
    if (stored) {
      const deadlines = JSON.parse(stored);
      return deadlines.slice(0, limit);
    }

    // Generate mock deadlines
    const mockDeadlines: DeadlineDto[] = [
      {
        id: '1',
        volunteer: 'Sarah Johnson',
        volunteerEmail: 'sarah.johnson@email.com',
        goal: 'Complete Safety Training',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        status: 'in-progress',
        daysUntilDeadline: 5
      },
      {
        id: '2',
        volunteer: 'Mike Chen',
        volunteerEmail: 'mike.chen@email.com',
        goal: 'Submit Monthly Report',
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
        daysUntilDeadline: 8
      },
      {
        id: '3',
        volunteer: 'Emma Davis',
        volunteerEmail: 'emma.davis@email.com',
        goal: 'Event Planning Completion',
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'in-progress',
        daysUntilDeadline: 12
      }
    ];

    localStorage.setItem('upcomingDeadlines', JSON.stringify(mockDeadlines));
    return mockDeadlines.slice(0, limit);
  }

  private async getVolunteersWithGoalsFallback(): Promise<VolunteerWithGoalsDto[]> {
    const stored = localStorage.getItem('volunteersWithGoals');
    if (stored) {
      return JSON.parse(stored);
    }

    // Generate mock data
    const mockData: VolunteerWithGoalsDto[] = [
      {
        volunteerId: 'vol-1',
        volunteerName: 'Sarah Johnson',
        volunteerEmail: 'sarah.johnson@email.com',
        totalGoals: 8,
        completedGoals: 6,
        pendingGoals: 1,
        inProgressGoals: 1,
        completionRate: 75,
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        recentGoals: [
          {
            id: 'goal-1',
            title: 'Safety Training',
            status: 'completed',
            progress: 100,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        volunteerId: 'vol-2',
        volunteerName: 'Mike Chen',
        volunteerEmail: 'mike.chen@email.com',
        totalGoals: 5,
        completedGoals: 3,
        pendingGoals: 1,
        inProgressGoals: 1,
        completionRate: 60,
        lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        recentGoals: [
          {
            id: 'goal-2',
            title: 'Community Outreach',
            status: 'in-progress',
            progress: 45,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];

    localStorage.setItem('volunteersWithGoals', JSON.stringify(mockData));
    return mockData;
  }

  private getAdminPermissions(role: string): string[] {
    const basePermissions = [
      'view_users',
      'view_goals',
      'view_analytics',
      'view_activity_logs'
    ];

    if (role === 'admin') {
      return [
        ...basePermissions,
        'create_users',
        'edit_users',
        'delete_users',
        'create_goals',
        'edit_goals',
        'delete_goals',
        'system_settings',
        'bulk_operations',
        'manage_templates',
        'view_system_stats',
        'manage_preferences'
      ];
    }

    return basePermissions;
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
      isOnline: this.isOnline,
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