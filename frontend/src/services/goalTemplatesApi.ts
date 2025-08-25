import httpClient from './httpClient';

// Import types from backend DTOs
export interface GoalTemplateResponseDto {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  status: 'active' | 'inactive';
  usageCount: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalTemplateDto {
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateGoalTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  defaultDuration?: number;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  usageCount?: number;
}

export interface GoalTemplateFiltersDto {
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedGoalTemplatesResponse {
  templates: GoalTemplateResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UseTemplateDto {
  templateId: string;
  title: string;
  description?: string;
  dueDate: string;
  volunteerId?: string;
  customNotes?: string;
}

export interface TemplateUsageStatsDto {
  totalUsage: number;
  recentUsage: number;
  avgCompletionRate: number;
  popularityRank: number;
  monthlyUsage: MonthlyUsageData[];
  categoryRank: number;
  userFeedback: TemplateFeedbackData[];
}

export interface MonthlyUsageData {
  month: string;
  year: number;
  usageCount: number;
  completionRate: number;
}

export interface TemplateFeedbackData {
  userId: string;
  userName: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface TemplateCategoryStatsDto {
  category: string;
  totalTemplates: number;
  totalUsage: number;
  avgRating: number;
  popularTemplates: GoalTemplateResponseDto[];
}

export interface TemplateAnalyticsDto {
  totalTemplates: number;
  activeTemplates: number;
  totalUsage: number;
  avgUsagePerTemplate: number;
  topCategories: TemplateCategoryStatsDto[];
  recentlyCreated: GoalTemplateResponseDto[];
  mostUsed: GoalTemplateResponseDto[];
  trendingTemplates: GoalTemplateResponseDto[];
}

// Frontend Goal Template interface (for compatibility)
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  defaultDuration: number;
  tags: string[];
  status?: string;
  isActive?: boolean;
  usageCount: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

class GoalTemplatesApiService {
  // CORE CRUD OPERATIONS

  /**
   * Get all goal templates with filters and pagination
   */
  async getAll(filters?: GoalTemplateFiltersDto): Promise<PaginatedGoalTemplatesResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters that the backend supports
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.createdBy) params.append('createdBy', filters.createdBy);
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      

      const response = await httpClient.get<PaginatedGoalTemplatesResponse>(
        `/goal-templates?${params.toString()}`
      );

      console.log('Goal templates loaded from backend');
      return response;
    } catch (error: any) {
      console.error('Failed to load goal templates from backend:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get specific goal template by ID
   */
  async getById(id: string): Promise<GoalTemplateResponseDto> {
    try {
      const response = await httpClient.get<GoalTemplateResponseDto>(`/goal-templates/${id}`);
      return response;
    } catch (error: any) {
      console.error('Failed to get goal template:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Create new goal template (Admin only)
   */
  async create(data: CreateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    try {
      console.log('Creating goal template');
      
      const response = await httpClient.post<GoalTemplateResponseDto>('/goal-templates', data);
      
      console.log('Goal template created successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to create goal template:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Update goal template (Admin only)
   */
  async update(id: string, data: UpdateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    try {
      console.log(`Updating goal template ${id}`);
      
      const response = await httpClient.patch<GoalTemplateResponseDto>(`/goal-templates/${id}`, data);
      
      console.log('Goal template updated successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to update goal template:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Delete goal template (Admin only)
   */
  async delete(id: string): Promise<void> {
    try {
      console.log(`Deleting goal template ${id}`);
      
      await httpClient.delete(`/goal-templates/${id}`);
      
      console.log('Goal template deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete goal template:', error);
      throw this.transformError(error);
    }
  }

  // TEMPLATE MANAGEMENT OPERATIONS

  /**
   * Get available template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await httpClient.get<{ categories: string[] }>('/goal-templates/categories');
      return response.categories;
    } catch (error: any) {
      console.error('Failed to get categories:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get popular templates by usage count
   */
  async getPopular(limit: number = 10): Promise<GoalTemplateResponseDto[]> {
    try {
      const response = await httpClient.get<GoalTemplateResponseDto[]>(
        `/goal-templates/popular?limit=${limit}`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get popular templates:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Duplicate existing template (Admin only)
   */
  async duplicate(id: string): Promise<GoalTemplateResponseDto> {
    try {
      console.log(`Duplicating goal template ${id}`);
      
      const response = await httpClient.post<GoalTemplateResponseDto>(`/goal-templates/${id}/duplicate`);
      
      console.log('Goal template duplicated successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to duplicate goal template:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Use template to create a goal
   */
  async useTemplate(useTemplateDto: UseTemplateDto): Promise<any> {
    try {
      console.log(`Using template ${useTemplateDto.templateId} to create goal`);
      
      const response = await httpClient.post<any>(
        `/goal-templates/${useTemplateDto.templateId}/use`, 
        useTemplateDto
      );
      
      console.log('Goal created from template successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to use template:', error);
      throw this.transformError(error);
    }
  }

  // ANALYTICS AND STATISTICS

  /**
   * Get template usage statistics (Admin only)
   */
  async getUsageStats(templateId: string): Promise<TemplateUsageStatsDto> {
    try {
      const response = await httpClient.get<TemplateUsageStatsDto>(
        `/goal-templates/${templateId}/usage-stats`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get usage stats:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get template analytics overview (Admin only)
   */
  async getAnalytics(): Promise<TemplateAnalyticsDto> {
    try {
      const response = await httpClient.get<TemplateAnalyticsDto>('/goal-templates/analytics');
      return response;
    } catch (error: any) {
      console.error('Failed to get analytics:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<TemplateCategoryStatsDto[]> {
    try {
      const response = await httpClient.get<TemplateCategoryStatsDto[]>('/goal-templates/category-stats');
      return response;
    } catch (error: any) {
      console.error('Failed to get category stats:', error);
      throw this.transformError(error);
    }
  }

  // FRONTEND COMPATIBILITY METHODS

  /**
   * Convert frontend template format to backend DTO
   */
  toBackendDto(template: GoalTemplate): CreateGoalTemplateDto {
    return {
      name: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority,
      defaultDuration: template.defaultDuration,
      tags: template.tags,
      status: template.isActive === false ? 'inactive' : 'active'
    };
  }

  private transformError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }
}

export const goalTemplatesApi = new GoalTemplatesApiService();
export default goalTemplatesApi;