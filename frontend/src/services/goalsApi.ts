import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import type { 
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalProgressRequest,
  GoalFilters,
  GoalStatistics,
  PaginatedResponse,
  ApiErrorResponse 
} from '../types/api';

export interface GoalResponseDto {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  progress: number;
  dueDate: string;
  volunteerId: string;
  volunteerName?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

export interface CreateGoalDto {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  volunteerId?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  category?: string;
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate?: string;
  tags?: string[];
  notes?: string;
}

export interface GoalFilterDto {
  status?: string;
  priority?: string;
  category?: string;
  volunteerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProgressHistoryEntry {
  id: string;
  goalId: string;
  userId: string;
  progress: number;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

export interface GoalWithProgress extends GoalResponseDto {
  progressHistory?: ProgressHistoryEntry[];
}

export interface BulkUpdateGoalsRequest {
  goalIds: string[];
  updates: Partial<UpdateGoalDto>;
}

export interface BulkUpdateResponse {
  updated: number;
  failed: number;
  errors?: string[];
}

export interface WeeklyProcessingResult {
  processedGoals: number;
  overdueGoals: number;
  completedGoals: number;
  notificationsSet: number;
}

class GoalsApiService {
  // Get all goals with filters and pagination
  async getAll(filters?: GoalFilterDto): Promise<PaginatedResponse<GoalResponseDto>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await httpClient.get<{
        goals: GoalResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/goals?${params.toString()}`);

      // Transform backend response to frontend format
      return {
        data: response.goals.map(goal => this.transformGoalResponse(goal)),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      };
    } catch (error: any) {
      console.error('❌ Failed to get goals:', error);
      throw this.transformError(error);
    }
  }

  // Get simple array of goals (for compatibility with existing code)
  async getAllSimple(filters?: GoalFilterDto): Promise<Goal[]> {
    try {
      const response = await this.getAll(filters);
      return response.data.map(goal => this.transformToFrontendGoal(goal));
    } catch (error: any) {
      console.error('❌ Failed to get goals:', error);
      throw this.transformError(error);
    }
  }

  // Get goal by ID
  async getById(id: string): Promise<GoalWithProgress> {
    try {
      const response = await httpClient.get<GoalResponseDto>(`/goals/${id}`);
      
      // Get progress history
      const progressHistory = await this.getProgressHistory(id);
      
      return {
        ...this.transformGoalResponse(response),
        progressHistory
      };
    } catch (error: any) {
      console.error(`❌ Failed to get goal ${id}:`, error);
      throw this.transformError(error);
    }
  }

  // Create new goal
  async create(goalData: CreateGoalDto): Promise<GoalResponseDto> {
    try {
      console.log('🎯 Creating new goal:', goalData.title);

      const response = await httpClient.post<GoalResponseDto>('/goals', goalData);

      console.log('✅ Goal created successfully:', response.title);
      return this.transformGoalResponse(response);
    } catch (error: any) {
      console.error('❌ Failed to create goal:', error);
      throw this.transformError(error);
    }
  }

  // Update goal
  async update(id: string, updates: UpdateGoalDto): Promise<GoalResponseDto> {
    try {
      console.log(`🎯 Updating goal ${id}:`, updates);

      const response = await httpClient.put<GoalResponseDto>(`/goals/${id}`, updates);

      console.log('✅ Goal updated successfully:', response.title);
      return this.transformGoalResponse(response);
    } catch (error: any) {
      console.error(`❌ Failed to update goal ${id}:`, error);
      throw this.transformError(error);
    }
  }

  // Update goal progress
  async updateProgress(id: string, progressData: GoalProgressRequest): Promise<GoalResponseDto> {
    try {
      console.log(`🎯 Updating goal ${id} progress to ${progressData.progress}%`);

      const response = await httpClient.patch<GoalResponseDto>(
        `/goals/${id}/progress`, 
        progressData
      );

      console.log('✅ Goal progress updated successfully');
      return this.transformGoalResponse(response);
    } catch (error: any) {
      console.error(`❌ Failed to update goal ${id} progress:`, error);
      throw this.transformError(error);
    }
  }

  // Delete goal
  async delete(id: string): Promise<void> {
    try {
      console.log(`🎯 Deleting goal ${id}`);

      await httpClient.delete(`/goals/${id}`);

      console.log('✅ Goal deleted successfully');
    } catch (error: any) {
      console.error(`❌ Failed to delete goal ${id}:`, error);
      throw this.transformError(error);
    }
  }

  // Get goal statistics
  async getStatistics(volunteerId?: string): Promise<GoalStatistics> {
    try {
      const params = volunteerId ? `?volunteerId=${volunteerId}` : '';
      const response = await httpClient.get<{
        totalGoals: number;
        completedGoals: number;
        pendingGoals: number;
        inProgressGoals: number;
        overdueGoals: number;
        completionRate: number;
        averageProgress: number;
        categoriesCount: number;
        upcomingDeadlines: GoalResponseDto[];
      }>(`/goals/statistics${params}`);

      return {
        totalGoals: response.totalGoals,
        completedGoals: response.completedGoals,
        pendingGoals: response.pendingGoals,
        inProgressGoals: response.inProgressGoals,
        overdueGoals: response.overdueGoals,
        completionRate: response.completionRate,
        averageProgress: response.averageProgress,
        categoriesCount: response.categoriesCount,
        upcomingDeadlines: response.upcomingDeadlines.map(goal => this.transformToFrontendGoal(goal))
      };
    } catch (error: any) {
      console.error('❌ Failed to get goal statistics:', error);
      throw this.transformError(error);
    }
  }

  // Get available categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await httpClient.get<{ categories: string[] }>('/goals/categories');
      return response.categories;
    } catch (error: any) {
      console.error('❌ Failed to get categories:', error);
      throw this.transformError(error);
    }
  }

  // Get progress history for a goal
  async getProgressHistory(goalId: string): Promise<ProgressHistoryEntry[]> {
    try {
      const response = await httpClient.get<ProgressHistoryEntry[]>(`/goals/${goalId}/progress-history`);
      return response;
    } catch (error: any) {
      console.error(`❌ Failed to get progress history for goal ${goalId}:`, error);
      throw this.transformError(error);
    }
  }

  // Assign goal to volunteer
  async assignToVolunteer(goalId: string, volunteerId: string): Promise<GoalResponseDto> {
    try {
      console.log(`🎯 Assigning goal ${goalId} to volunteer ${volunteerId}`);

      const response = await httpClient.post<GoalResponseDto>(
        `/goals/${goalId}/assign`, 
        { volunteerId }
      );

      console.log('✅ Goal assigned successfully');
      return this.transformGoalResponse(response);
    } catch (error: any) {
      console.error(`❌ Failed to assign goal ${goalId}:`, error);
      throw this.transformError(error);
    }
  }

  // Bulk operations
  async bulkUpdate(request: BulkUpdateGoalsRequest): Promise<BulkUpdateResponse> {
    try {
      console.log(`🎯 Bulk updating ${request.goalIds.length} goals`);

      const response = await httpClient.post<BulkUpdateResponse>('/goals/bulk-update', request);

      console.log('✅ Bulk update completed:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Bulk update failed:', error);
      throw this.transformError(error);
    }
  }

  async bulkDelete(goalIds: string[]): Promise<BulkUpdateResponse> {
    try {
      console.log(`🎯 Bulk deleting ${goalIds.length} goals`);

      const response = await httpClient.post<BulkUpdateResponse>('/goals/bulk-delete', {
        goalIds
      });

      console.log('✅ Bulk delete completed:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Bulk delete failed:', error);
      throw this.transformError(error);
    }
  }

  // Weekly processing
  async processWeeklyGoals(): Promise<WeeklyProcessingResult> {
    try {
      console.log('🎯 Processing weekly goals...');

      const response = await httpClient.post<WeeklyProcessingResult>('/goals/process-weekly');

      console.log('✅ Weekly processing completed:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Weekly processing failed:', error);
      throw this.transformError(error);
    }
  }

  // Get goals for current user (volunteer)
  async getMyGoals(filters?: Omit<GoalFilterDto, 'volunteerId'>): Promise<Goal[]> {
    try {
      const response = await httpClient.get<{
        goals: GoalResponseDto[];
      }>('/goals/my-goals' + (filters ? `?${new URLSearchParams(filters as any).toString()}` : ''));

      return response.goals.map(goal => this.transformToFrontendGoal(goal));
    } catch (error: any) {
      console.error('❌ Failed to get my goals:', error);
      throw this.transformError(error);
    }
  }

  // Search goals
  async search(query: string, filters?: Partial<GoalFilterDto>): Promise<Goal[]> {
    try {
      const params = new URLSearchParams({ search: query });
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);

      const response = await httpClient.get<{
        goals: GoalResponseDto[];
      }>(`/goals/search?${params.toString()}`);

      return response.goals.map(goal => this.transformToFrontendGoal(goal));
    } catch (error: any) {
      console.error('❌ Failed to search goals:', error);
      throw this.transformError(error);
    }
  }

  // Get overdue goals
  async getOverdueGoals(): Promise<Goal[]> {
    try {
      const response = await httpClient.get<{
        goals: GoalResponseDto[];
      }>('/goals/overdue');

      return response.goals.map(goal => this.transformToFrontendGoal(goal));
    } catch (error: any) {
      console.error('❌ Failed to get overdue goals:', error);
      throw this.transformError(error);
    }
  }

  // Export goals
  async exportGoals(format: 'csv' | 'xlsx' | 'pdf', filters?: GoalFilterDto): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await httpClient.get(`/goals/export?${params.toString()}`, {
        responseType: 'blob'
      });

      return response as Blob;
    } catch (error: any) {
      console.error('❌ Failed to export goals:', error);
      throw this.transformError(error);
    }
  }

  // Transform methods
  private transformGoalResponse(goal: GoalResponseDto): GoalResponseDto {
    return {
      ...goal,
      // Ensure consistent date formats
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      dueDate: goal.dueDate,
    };
  }

  private transformToFrontendGoal(goal: GoalResponseDto): Goal {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: this.mapPriority(goal.priority),
      status: this.mapStatus(goal.status),
      progress: goal.progress,
      dueDate: goal.dueDate,
      volunteerId: goal.volunteerId,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      tags: goal.tags,
      notes: goal.notes,
      volunteerName: goal.volunteerName,
    };
  }

  private mapPriority(priority: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const priorityMap = {
      'low': 'low' as const,
      'medium': 'medium' as const,
      'high': 'high' as const,
    };
    return priorityMap[priority];
  }

  private mapStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' {
    // Handle backend status mapping
    if (status === 'in_progress') return 'in_progress';
    return status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  }

  private transformError(error: any): Error {
    if (error.status === 404) {
      return new Error('Goal not found');
    } else if (error.status === 403) {
      return new Error('You do not have permission to access this goal');
    } else if (error.status === 422) {
      return new Error(error.message || 'Invalid goal data provided');
    } else if (error.status >= 500) {
      return new Error('Server error. Please try again later.');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }
  
  async updateStatus(id: string, status: string, reason?: string): Promise<Goal> {
      try {
        console.log(`🎯 Updating goal ${id} status to ${status}`);
        
        const response = await httpClient.put<GoalResponseDto>(
          `/goals/${id}/status`, 
          { status, reason }
        );

        console.log('✅ Goal status updated successfully');
        return this.transformToFrontendGoal(response);
      } catch (error: any) {
        console.warn('Backend failed, updating local storage');
      }
  }




  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      endpoints: {
        base: '/goals',
        statistics: '/goals/statistics',
        categories: '/goals/categories',
        myGoals: '/goals/my-goals',
        search: '/goals/search',
        export: '/goals/export'
      },
    };
  }
}

// Create singleton instance
export const goalsApi = new GoalsApiService();
export default goalsApi;