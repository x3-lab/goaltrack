import httpClient from './httpClient';
import type { Goal } from '../types/api';

export interface GoalResponseDto {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;         // backend: LOW | MEDIUM | HIGH
  status: string;           // backend: PENDING | IN_PROGRESS | COMPLETED | CANCELLED | OVERDUE
  progress: number;
  startDate?: string;
  dueDate: string;
  volunteerId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string[];          // backend stores simple-array
  progressHistory?: any[];   // relation when included
}

export interface CreateGoalDto {
  title: string;
  description?: string;
  category: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate: string;          // ISO/date string
  startDate?: string;       // required by backend; we will ensure it
  volunteerId?: string;
  tags?: string[];
  notes?: string | string[];
  progress?: number;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  category?: string;
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate?: string;
  tags?: string[];
  notes?: string[];
}

export interface GoalFilterDto {
  status?: string;
  priority?: string;
  category?: string;
  volunteerId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  private baseURL = '/goals';

  // Map backend -> frontend
  private mapBackendStatus(status: string): Goal['status'] {
    const map: Record<string, Goal['status']> = {
      pending: 'pending',
      PENDING: 'pending',
      in_progress: 'in-progress',
      IN_PROGRESS: 'in-progress',
      completed: 'completed',
      COMPLETED: 'completed',
      cancelled: 'cancelled',
      CANCELLED: 'cancelled',
      overdue: 'overdue',
      OVERDUE: 'overdue'
    };
    return map[status] || (status.toLowerCase() as Goal['status']);
  }

  private mapBackendPriority(priority: string): Goal['priority'] {
    const map: Record<string, Goal['priority']> = {
      low: 'low',
      LOW: 'low',
      medium: 'medium',
      MEDIUM: 'medium',
      high: 'high',
      HIGH: 'high'
    };
    return map[priority] || (priority.toLowerCase() as Goal['priority']);
  }

  // Frontend -> backend
  private mapFrontendStatus(status?: string): string | undefined {
    if (!status) return undefined;
    const map: Record<string, string> = {
      'pending': 'pending',
      'in-progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'overdue': 'overdue'
    };
    return map[status] || status;
  }

  private mapFrontendPriority(priority?: string): string | undefined {
    if (!priority) return undefined;
    return priority.toLowerCase();
  }

  private toFrontend(goal: GoalResponseDto): Goal {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: this.mapBackendPriority(goal.priority),
      status: this.mapBackendStatus(goal.status),
      progress: goal.progress,
      startDate: goal.startDate || new Date().toISOString().split('T')[0],
      dueDate: goal.dueDate,
      volunteerId: goal.volunteerId,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      tags: goal.tags,
      notes: goal.notes?.join ? goal.notes : goal.notes,
      volunteerName: undefined,
    };
  }

  private transformError(error: any): Error {
    if (error.status === 404) return new Error('Goal not found');
    if (error.status === 403) return new Error('You do not have permission for this action');
    if (error.status === 400 || error.status === 422) return new Error(error.message || 'Invalid goal data');
    if (error.status >= 500) return new Error('Server error. Please try again later.');
    return new Error(error.message || 'Unexpected error');
  }

  // Core fetch: GET /goals (applies user scoping server-side)
  async list(filters?: GoalFilterDto): Promise<{ goals: Goal[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', this.mapFrontendStatus(filters.status)!);
      if (filters?.priority) params.append('priority', this.mapFrontendPriority(filters.priority)!);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
      if (filters?.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', (filters.sortOrder === 'asc' ? 'ASC' : filters.sortOrder === 'desc' ? 'DESC' : filters.sortOrder || '').toString());

      const query = params.toString();
      const response = await httpClient.get<{
        goals: GoalResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${this.baseURL}${query ? `?${query}` : ''}`);

      return {
        goals: response.goals.map(g => this.toFrontend(g)),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      };
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async getMyGoals(filters?: Omit<GoalFilterDto, 'volunteerId'>): Promise<Goal[]> {
    const { goals } = await this.list(filters);
    return goals;
  }

  async getById(id: string): Promise<Goal> {
    try {
      const response = await httpClient.get<GoalResponseDto>(`${this.baseURL}/${id}`);
      return this.toFrontend(response);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async create(data: CreateGoalDto): Promise<Goal> {
    try {
      const normalizeDate = (d?: string) => {
        if (!d) return undefined;
        // accept YYYY-MM-DD or full ISO; if date-only, leave as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? undefined : dt.toISOString();
      };

      const notesArray = (() => {
        if (!data.notes) return undefined;
        if (Array.isArray(data.notes)) return data.notes;
        if (typeof data.notes === 'string') {
          const t = data.notes.trim();
          return t ? [t] : undefined;
        }
        return undefined;
      })();

      const payload: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        volunteerId: data.volunteerId,
        priority: this.mapFrontendPriority(data.priority || 'medium'),
        startDate: normalizeDate(data.startDate) || new Date().toISOString().split('T')[0],
        dueDate: normalizeDate(data.dueDate),
        tags: data.tags,
        notes: notesArray,
        progress: typeof data.progress === 'number' ? data.progress : 0
      };

      const response = await httpClient.post<GoalResponseDto>(this.baseURL, payload);
      return this.toFrontend(response);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async update(id: string, updates: UpdateGoalDto): Promise<Goal> {
    try {
      const payload: any = { ...updates };
      if (updates.status) payload.status = this.mapFrontendStatus(updates.status);
      if (updates.priority) payload.priority = this.mapFrontendPriority(updates.priority);
      if (updates.dueDate) {
        const dt = new Date(updates.dueDate);
        if (!isNaN(dt.getTime())) payload.dueDate = dt.toISOString();
      }
      if (payload.notes && !Array.isArray(payload.notes)) {
        delete payload.notes;
      }
      const response = await httpClient.patch<GoalResponseDto>(`${this.baseURL}/${id}`, payload);
      return this.toFrontend(response);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async updateStatus(id: string, status: Goal['status']): Promise<Goal> {
    try {
      const response = await httpClient.patch<GoalResponseDto>(`${this.baseURL}/${id}/status`, {
        status: this.mapFrontendStatus(status)
      });
      return this.toFrontend(response);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async updateProgress(id: string, data: { progress: number; notes?: string }): Promise<Goal> {
    try {
      const response = await httpClient.patch<GoalResponseDto>(`${this.baseURL}/${id}/progress`, {
        progress: data.progress,
        notes: data.notes
      });
      return this.toFrontend(response);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseURL}/${id}`);
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async getStatistics(volunteerId?: string): Promise<{
    totalGoals: number;
    completedGoals: number;
    pendingGoals: number;
    inProgressGoals: number;
    overdueGoals: number;
    completionRate: number;
    averageProgress: number;
    categoriesCount: number;
    upcomingDeadlines: Goal[];
  }> {
    try {
      const response = await httpClient.get<any>(`${this.baseURL}/statistics${volunteerId ? `?volunteerId=${volunteerId}` : ''}`);
      return {
        ...response,
        upcomingDeadlines: (response.upcomingDeadlines || []).map((g: GoalResponseDto) => this.toFrontend(g))
      };
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const res = await httpClient.get<{ categories: string[] }>(`${this.baseURL}/categories`);
      return res.categories;
    } catch (e: any) {
      throw this.transformError(e);
    }
  }

   // Bulk operations
  async bulkUpdate(request: BulkUpdateGoalsRequest): Promise<BulkUpdateResponse> {
    try {
      console.log(`Bulk updating ${request.goalIds.length} goals`);

      const response = await httpClient.post<BulkUpdateResponse>(`${this.baseURL}/bulk-update`, request);

      console.log('Bulk update completed:', response);
      return response;
    } catch (error: any) {
      console.error('Bulk update failed:', error);
      throw this.transformError(error);
    }
  }

  async bulkDelete(goalIds: string[]): Promise<BulkUpdateResponse> {
    try {
      console.log(`Bulk deleting ${goalIds.length} goals`);

      const response = await httpClient.post<BulkUpdateResponse>(`${this.baseURL}/bulk-delete`, {
        goalIds
      });

      console.log('Bulk delete completed:', response);
      return response;
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      throw this.transformError(error);
    }
  }

  // Weekly processing
  async processWeeklyGoals(): Promise<WeeklyProcessingResult> {
    try {
      console.log('Processing weekly goals...');

      const response = await httpClient.post<WeeklyProcessingResult>(`${this.baseURL}/process-weekly`);

      console.log('Weekly processing completed:', response);
      return response;
    } catch (error: any) {
      console.error('Weekly processing failed:', error);
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

      const response = await httpClient.get(`${this.baseURL}/export?${params.toString()}`, {
        responseType: 'blob'
      });

      return response as Blob;
    } catch (error: any) {
      console.error('Failed to export goals:', error);
      throw this.transformError(error);
    }
  }

}
export const goalsApi = new GoalsApiService();
export default goalsApi;