import httpClient from './httpClient';
import { adminApi } from './adminApi';

export interface DashboardMetricsDto {
  volunteersCount: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    changePercentage: number;
  };
  goalsCount: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    newThisMonth: number;
    changePercentage: number;
  };
  completionRate: {
    overall: number;
    lastMonth: number;
    changePercentage: number;
  };
  avgGoalCompletion: {
    days: number;
    lastMonth: number;
    changePercentage: number;
  };
}

export interface AdminNotificationDto {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  linkText?: string;
}

export interface SystemHealthDto {
  status: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    details?: Record<string, any>;
  }>;
  lastCheck: string;
}

export interface RecentUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  registrationDate: string;
  lastLogin?: string;
  completedGoals: number;
  totalGoals: number;
}

class AdminDashboardApiService {
  private isOnline = false;
  private baseURL = '/admin/dashboard';

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await httpClient.get(`${this.baseURL}/health`);
      this.isOnline = true;
      console.log('✅ Admin Dashboard API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('🔄 Admin Dashboard API using fallback mode');
    }
  }

  /**
   * Get comprehensive dashboard metrics for admins
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    if (this.isOnline) {
      try {
        console.log('📊 Getting dashboard metrics...');
        
        const response = await httpClient.get<DashboardMetricsDto>(`${this.baseURL}/metrics`);
        
        console.log('✅ Dashboard metrics loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback - use simple stats from adminApi
    const stats = await adminApi.getDashboardStats();
    
    return {
      volunteersCount: {
        total: stats.activeVolunteers,
        active: stats.activeVolunteers,
        inactive: 0,
        newThisMonth: stats.monthlyChanges.volunteers > 0 ? stats.monthlyChanges.volunteers : 0,
        changePercentage: this.calculatePercentage(stats.monthlyChanges.volunteers, stats.activeVolunteers)
      },
      goalsCount: {
        total: stats.totalGoals,
        completed: Math.round(stats.totalGoals * (stats.completionRate / 100)),
        inProgress: stats.totalGoals - Math.round(stats.totalGoals * (stats.completionRate / 100)) - stats.overdueGoals,
        overdue: stats.overdueGoals,
        newThisMonth: stats.monthlyChanges.goals > 0 ? stats.monthlyChanges.goals : 0,
        changePercentage: this.calculatePercentage(stats.monthlyChanges.goals, stats.totalGoals)
      },
      completionRate: {
        overall: stats.completionRate,
        lastMonth: stats.completionRate - stats.monthlyChanges.completion,
        changePercentage: stats.monthlyChanges.completion
      },
      avgGoalCompletion: {
        days: 14, // Default value
        lastMonth: 15,
        changePercentage: -6.7
      }
    };
  }

  /**
   * Get unread notifications for admin
   */
  async getAdminNotifications(limit: number = 10): Promise<AdminNotificationDto[]> {
    if (this.isOnline) {
      try {
        console.log(`🔔 Getting admin notifications (limit: ${limit})...`);
        
        const response = await httpClient.get<AdminNotificationDto[]>(
          `${this.baseURL}/notifications?limit=${limit}`
        );
        
        console.log(`✅ Admin notifications loaded successfully (${response.length} items)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback - generate mock notifications
    return this.generateMockNotifications(limit);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (this.isOnline) {
      try {
        console.log(`🔔 Marking notification ${notificationId} as read...`);
        
        await httpClient.put(`${this.baseURL}/notifications/${notificationId}/read`);
        
        console.log('✅ Notification marked as read successfully');
      } catch (error: any) {
        console.warn('Backend failed');
        throw error;
      }
    } else {
      console.log('📝 Simulating marking notification as read');
      // Simulate success in offline mode
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealthDto> {
    if (this.isOnline) {
      try {
        console.log('🔍 Checking system health...');
        
        const response = await httpClient.get<SystemHealthDto>(`${this.baseURL}/health`);
        
        console.log(`✅ System health check complete: ${response.status}`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }
  }

  /**
   * Get recently registered users
   */
  async getRecentUsers(limit: number = 5): Promise<RecentUserDto[]> {
    if (this.isOnline) {
      try {
        console.log(`👥 Getting recent users (limit: ${limit})...`);
        
        const response = await httpClient.get<RecentUserDto[]>(
          `${this.baseURL}/recent-users?limit=${limit}`
        );
        
        console.log(`✅ Recent users loaded successfully (${response.length} users)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }
  }

  // PRIVATE UTILITY METHODS
  
  private calculatePercentage(change: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((change / total) * 100);
  }

  private generateMockNotifications(limit: number): AdminNotificationDto[] {
    const notifications: AdminNotificationDto[] = [
      {
        id: 'notif1',
        type: 'warning',
        title: 'Overdue Goals',
        message: 'There are 5 overdue goals that require attention.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        link: '/admin-dashboard/goals?status=overdue',
        linkText: 'View Overdue Goals'
      },
      {
        id: 'notif2',
        type: 'info',
        title: 'New User Registration',
        message: 'Alice Johnson has registered as a new volunteer.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: false,
        link: '/admin-dashboard/volunteers',
        linkText: 'View Volunteers'
      },
      {
        id: 'notif3',
        type: 'success',
        title: 'Weekly Summary',
        message: '10 goals were completed last week, 85% completion rate.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        link: '/admin-dashboard/analytics',
        linkText: 'View Analytics'
      }
    ];

    return notifications.slice(0, limit);
  }
}

export const adminDashboardApi = new AdminDashboardApiService();
export default adminDashboardApi;