import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import { authApi, type ChangePasswordRequest } from './authApi';
import type { User } from '../types/api';

export interface AdminProfile extends User {
  department?: string;
  title?: string;
  lastLogin?: string;
  permissions?: string[];
  totalVolunteersManaged?: number;
  totalGoalsCreated?: number;
  systemRole?: string;
}

export interface AdminProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  title?: string;
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
  async getAdminProfile(): Promise<AdminProfile> {
    try {
      console.log('Getting admin profile...');

      const response = await httpClient.get<User>('/auth/profile');
      
      const adminProfile: AdminProfile = {
        ...response,
        department: 'Administration',
        title: 'System Administrator',
        lastLogin: response.updatedAt,
        permissions: this.getAdminPermissions(response.role),
        totalVolunteersManaged: 0,
        totalGoalsCreated: 0,
        systemRole: response.role,
      };

      console.log('Admin profile loaded successfully');
      return adminProfile;
    } catch (error: any) {
      console.error('Failed to get admin profile:', error);
      throw this.transformError(error);
    }
  }

  async updateAdminProfile(updates: AdminProfileUpdate): Promise<AdminProfile> {
    try {
      console.log('👨‍💼 Updating admin profile:', updates);

      const response = await httpClient.put<User>('/auth/profile', updates);
      
      await authApi.updateUser(response);

      const adminProfile: AdminProfile = {
        ...response,
        department: 'Administration',
        title: 'System Administrator',
        lastLogin: response.updatedAt,
        permissions: this.getAdminPermissions(response.role),
        systemRole: response.role,
      };

      console.log('Admin profile updated successfully');
      return adminProfile;
    } catch (error: any) {
      console.error('Failed to update admin profile:', error);
      throw this.transformError(error);
    }
  }

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('Changing admin password...');

      const passwordData: ChangePasswordRequest = {
        currentPassword,
        newPassword
      };

      await authApi.changePassword(passwordData);

      console.log('Admin password changed successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to change admin password:', error);
      throw this.transformError(error);
    }
  }

  // System Statistics
  async getSystemStats(): Promise<AdminStats> {
    try {
      console.log('📊 Getting system statistics...');

      const response = await httpClient.get<AdminStats>(ENDPOINTS.ADMIN.STATS);

      console.log('System stats loaded successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to get system stats:', error);
      throw this.transformError(error);
    }
  }

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

  // System Actions
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
        'bulk_operations'
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

  getDebugInfo(): object {
    return {
      serviceReady: true,
      endpoints: {
        stats: ENDPOINTS.ADMIN.STATS,
        users: ENDPOINTS.ADMIN.USERS,
        goals: ENDPOINTS.ADMIN.GOALS,
        activityLogs: ENDPOINTS.ADMIN.ACTIVITY_LOGS,
      },
    };
  }
}

export const adminApi = new AdminApiService();
export default adminApi;