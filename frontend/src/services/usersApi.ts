import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import type {
  User,
  PaginatedResponse,
  CreateUserRequest,
  ApiErrorResponse
} from '../types/api';

export interface Volunteer extends User {
  goals?: number;
  completedGoals?: number;
  goalsInProgress?: number;
  lastActivity?: string;
  averageProgress?: number;
  joinDate?: string;
}

export interface CreateVolunteerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  skills?: string;
  notes?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
  role?: 'volunteer';
  password?: string;
}

export interface UpdateVolunteerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  skills?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export interface UserFilters {
  status?: 'active' | 'inactive';
  role?: 'admin' | 'volunteer';
  search?: string;
  sortBy?: 'name' | 'email' | 'joinDate' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserAnalytics {
  userId: string;
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  pendingGoals: number;
  completionRate: number;
  averageProgress: number;
  streak: number;
  lastActivityDate: string;
  monthlyStats: Array<{
    month: string;
    goalsCreated: number;
    goalsCompleted: number;
  }>;
}

class UsersApiService {
  async getAll(filters?: UserFilters): Promise<Volunteer[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder.toUpperCase());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await httpClient.get<{
        users: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(
        `${ENDPOINTS.USERS.BASE}?${params.toString()}`
      );

      return response.users.map(user => this.transformUserToVolunteer(user));
    } catch (error: any) {
      console.error('Failed to get users:', error);
      throw this.transformError(error);
    }
  }

  async getAllPaginated(filters?: UserFilters): Promise<PaginatedResponse<Volunteer>> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder.toUpperCase());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await httpClient.get<{
        users: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(
        `${ENDPOINTS.USERS.BASE}?${params.toString()}`
      );

      const volunteers = response.users.map(user => this.transformUserToVolunteer(user));

      return {
        data: volunteers,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      };
    } catch (error: any) {
      console.error('Failed to get users:', error);
      throw this.transformError(error);
    }
  }

  async getById(id: string): Promise<Volunteer> {
    try {
      const response = await httpClient.get<User>(ENDPOINTS.USERS.BY_ID(id));
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error(` Failed to get user ${id}:`, error);
      throw this.transformError(error);
    }
  }

  async create(userData: CreateVolunteerRequest): Promise<Volunteer> {
    try {
      console.log('👤 Creating new user:', userData.email);

      // Transform frontend data to backend format
      const backendUserData: CreateUserRequest = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        skills: userData.skills,
        notes: userData.notes,
        role: userData.role || 'volunteer',
        status: userData.status || 'active',
        password: userData.password || this.generateTempPassword(),
      };

      const response = await httpClient.post<User>(
        ENDPOINTS.USERS.BASE,
        backendUserData
      );

      console.log('User created successfully:', response.email);
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw this.transformError(error);
    }
  }

  async update(id: string, updates: UpdateVolunteerRequest): Promise<Volunteer> {
    try {
      console.log(`Updating user ${id}:`, updates);

      const response = await httpClient.put<User>(
        ENDPOINTS.USERS.BY_ID(id),
        updates
      );

      console.log('User updated successfully:', response.email);
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error(`Failed to update user ${id}:`, error);
      throw this.transformError(error);
    }
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Volunteer> {
    try {
      console.log(`Updating user ${id} status to:`, status);

      const response = await httpClient.put<User>(
        ENDPOINTS.USERS.STATUS(id),
        { status }
      );

      console.log('User status updated successfully');
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error(`Failed to update user ${id} status:`, error);
      throw this.transformError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log(`Deleting user ${id}`);

      await httpClient.delete(ENDPOINTS.USERS.BY_ID(id));

      console.log('User deleted successfully');
    } catch (error: any) {
      console.error(`Failed to delete user ${id}:`, error);
      throw this.transformError(error);
    }
  }

  async getUserGoals(id: string): Promise<any[]> {
    try {
      const response = await httpClient.get<any[]>(ENDPOINTS.USERS.GOALS(id));
      return response;
    } catch (error: any) {
      console.error(`Failed to get user ${id} goals:`, error);
      throw this.transformError(error);
    }
  }

  async getUserActivity(id: string, limit?: number): Promise<any[]> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await httpClient.get<any[]>(
        `${ENDPOINTS.USERS.ACTIVITY(id)}${params}`
      );
      return response;
    } catch (error: any) {
      console.error(`Failed to get user ${id} activity:`, error);
      throw this.transformError(error);
    }
  }

  async getUserAnalytics(id: string): Promise<UserAnalytics> {
    try {
      const response = await httpClient.get<UserAnalytics>(
        `${ENDPOINTS.USERS.BY_ID(id)}/analytics`
      );
      return response;
    } catch (error: any) {
      console.error(`Failed to get user ${id} analytics:`, error);
      throw this.transformError(error);
    }
  }

  async bulkUpdateStatus(userIds: string[], status: 'active' | 'inactive'): Promise<void> {
    try {
      console.log(`Bulk updating ${userIds.length} users status to:`, status);

      await httpClient.post(`${ENDPOINTS.USERS.BASE}/bulk/status`, {
        userIds,
        status
      });

      console.log('Bulk status update successful');
    } catch (error: any) {
      console.error('Bulk status update failed:', error);
      throw this.transformError(error);
    }
  }

  async bulkDelete(userIds: string[]): Promise<void> {
    try {
      console.log(`👥 Bulk deleting ${userIds.length} users`);

      await httpClient.post(`${ENDPOINTS.USERS.BASE}/bulk/delete`, {
        userIds
      });

      console.log('Bulk delete successful');
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      throw this.transformError(error);
    }
  }

  async getCurrentUserProfile(): Promise<Volunteer> {
    try {
      const response = await httpClient.get<User>('/auth/profile');
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error('Failed to get current user profile:', error);
      throw this.transformError(error);
    }
  }

  async updateCurrentUserProfile(updates: UpdateVolunteerRequest): Promise<Volunteer> {
    try {
      console.log(' Updating current user profile:', updates);

      const response = await httpClient.put<User>('/auth/profile', updates);

      console.log('Profile updated successfully');
      return this.transformUserToVolunteer(response);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw this.transformError(error);
    }
  }

  // Utility methods
  private transformUserToVolunteer(user: User): Volunteer {
    return {
      ...user,
      joinDate: user.createdAt,
      goals: 0,
      completedGoals: 0,
      goalsInProgress: 0,
      averageProgress: 0,
      lastActivity: user.updatedAt,
    };
  }

  private generateTempPassword(): string {
    // Generate a temporary password for admin-created accounts
    return Math.random().toString(36).slice(-12) + '!';
  }

  private transformError(error: any): Error {
    if (error.status === 404) {
      return new Error('User not found');
    } else if (error.status === 409) {
      return new Error('A user with this email already exists');
    } else if (error.status === 422) {
      return new Error(error.message || 'Invalid user data provided');
    } else if (error.status >= 500) {
      return new Error('Server error. Please try again later.');
    }

    return new Error(error.message || 'An unexpected error occurred');
  }

  getDebugInfo(): object {
    return {
      serviceReady: true,
      endpoints: ENDPOINTS.USERS,
    };
  }
}

export const usersApi = new UsersApiService();
export default usersApi;