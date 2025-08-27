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
      console.log('Admin Dashboard API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('Admin Dashboard API using fallback mode');
    }
  }

  /**
   * Get comprehensive dashboard metrics for admins
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    if (this.isOnline) {
      try {
        console.log('Getting dashboard metrics...');
        
        const response = await httpClient.get<DashboardMetricsDto>(`${this.baseURL}/metrics`);
        
        console.log('Dashboard metrics loaded successfully');
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
        console.log(`Getting admin notifications (limit: ${limit})...`);
        
        const response = await httpClient.get<AdminNotificationDto[]>(
          `${this.baseURL}/notifications?limit=${limit}`
        );
        
        console.log(`Admin notifications loaded successfully (${response.length} items)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (this.isOnline) {
      try {
        console.log(`🔔 Marking notification ${notificationId} as read...`);
        
        await httpClient.put(`${this.baseURL}/notifications/${notificationId}/read`);
        
        console.log('Notification marked as read successfully');
      } catch (error: any) {
        console.warn('Backend failed');
        throw error;
      }
    } else {
      console.log('Simulating marking notification as read');
      // Simulate success in offline mode
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  /**
   * Get recently registered users
   */
  async getRecentUsers(limit: number = 5): Promise<RecentUserDto[]> {
    if (this.isOnline) {
      try {
        console.log(`Getting recent users (limit: ${limit})...`);
        
        const response = await httpClient.get<RecentUserDto[]>(
          `${this.baseURL}/recent-users?limit=${limit}`
        );
        
        console.log(`Recent users loaded successfully (${response.length} users)`);
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
}

export const adminDashboardApi = new AdminDashboardApiService();
export default adminDashboardApi;