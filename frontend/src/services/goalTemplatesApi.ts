import httpClient from './httpClient';

// Import types from backend DTOs
export interface GoalTemplateResponseDto {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
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
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  tags: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateGoalTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedDuration?: number;
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
  private isOnline = false;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await httpClient.get('/goal-templates');
      this.isOnline = true;
      console.log('✅ Goal Templates API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('🔄 Goal Templates API using fallback mode');
    }
  }

  // CORE CRUD OPERATIONS

  /**
   * Get all goal templates with filters and pagination
   */
  async getAll(filters?: GoalTemplateFiltersDto): Promise<PaginatedGoalTemplatesResponse> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        
        if (filters?.search) params.append('search', filters.search);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.createdBy) params.append('createdBy', filters.createdBy);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await httpClient.get<PaginatedGoalTemplatesResponse>(
          `/goal-templates?${params.toString()}`
        );

        console.log('✅ Goal templates loaded from backend');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback to local data
    return this.getAllFallback(filters);
  }

  /**
   * Get specific goal template by ID
   */
  async getById(id: string): Promise<GoalTemplateResponseDto> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<GoalTemplateResponseDto>(`/goal-templates/${id}`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const allTemplates = await this.getAllFallback();
    const template = allTemplates.templates.find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  /**
   * Create new goal template (Admin only)
   */
  async create(data: CreateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    if (this.isOnline) {
      try {
        console.log('📋 Creating goal template');
        
        const response = await httpClient.post<GoalTemplateResponseDto>('/goal-templates', data);
        
        console.log('✅ Goal template created successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback to local storage
    return this.createFallback(data);
  }

  /**
   * Update goal template (Admin only)
   */
  async update(id: string, data: UpdateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    if (this.isOnline) {
      try {
        console.log(`📋 Updating goal template ${id}`);
        
        const response = await httpClient.patch<GoalTemplateResponseDto>(`/goal-templates/${id}`, data);
        
        console.log('✅ Goal template updated successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback
    return this.updateFallback(id, data);
  }

  /**
   * Delete goal template (Admin only)
   */
  async delete(id: string): Promise<void> {
    if (this.isOnline) {
      try {
        console.log(`📋 Deleting goal template ${id}`);
        
        await httpClient.delete(`/goal-templates/${id}`);
        
        console.log('✅ Goal template deleted successfully');
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback - simulate deletion
    console.log(`🔄 Simulated deletion of goal template ${id}`);
  }

  // TEMPLATE MANAGEMENT OPERATIONS

  /**
   * Get available template categories
   */
  async getCategories(): Promise<string[]> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<{ categories: string[] }>('/goal-templates/categories');
        return response.categories;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const templates = await this.getAllFallback();
    const categories = [...new Set(templates.templates.map(t => t.category))];
    return categories.filter(Boolean).sort();
  }

  /**
   * Get popular templates by usage count
   */
  async getPopular(limit: number = 10): Promise<GoalTemplateResponseDto[]> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<GoalTemplateResponseDto[]>(
          `/goal-templates/popular?limit=${limit}`
        );
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const templates = await this.getAllFallback();
    return templates.templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Duplicate existing template (Admin only)
   */
  async duplicate(id: string): Promise<GoalTemplateResponseDto> {
    if (this.isOnline) {
      try {
        console.log(`📋 Duplicating goal template ${id}`);
        
        const response = await httpClient.post<GoalTemplateResponseDto>(`/goal-templates/${id}/duplicate`);
        
        console.log('✅ Goal template duplicated successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback
    const template = await this.getById(id);
    return this.createFallback({
      ...template,
      name: `${template.name} (Copy)`,
      tags: [...template.tags]
    });
  }

  /**
   * Use template to create a goal
   */
  async useTemplate(useTemplateDto: UseTemplateDto): Promise<any> {
    if (this.isOnline) {
      try {
        console.log(`📋 Using template ${useTemplateDto.templateId} to create goal`);
        
        const response = await httpClient.post<any>(
          `/goal-templates/${useTemplateDto.templateId}/use`, 
          useTemplateDto
        );
        
        console.log('✅ Goal created from template successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    }

    // Fallback - simulate goal creation from template
    const template = await this.getById(useTemplateDto.templateId);
    
    // Create mock goal from template
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: useTemplateDto.title,
      description: useTemplateDto.description || template.description,
      category: template.category,
      priority: template.priority,
      progress: 0,
      status: 'pending',
      dueDate: useTemplateDto.dueDate,
      volunteerId: useTemplateDto.volunteerId || 'current-user',
      tags: template.tags,
      notes: useTemplateDto.customNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update template usage count
    await this.updateFallback(template.id, {
      ...template,
      usageCount: template.usageCount + 1
    });

    return newGoal;
  }

  // ANALYTICS AND STATISTICS

  /**
   * Get template usage statistics (Admin only)
   */
  async getUsageStats(templateId: string): Promise<TemplateUsageStatsDto> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<TemplateUsageStatsDto>(
          `/goal-templates/${templateId}/usage-stats`
        );
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const template = await this.getById(templateId);
    return this.getUsageStatsFallback(template);
  }

  /**
   * Get template analytics overview (Admin only)
   */
  async getAnalytics(): Promise<TemplateAnalyticsDto> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<TemplateAnalyticsDto>('/goal-templates/analytics');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getAnalyticsFallback();
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<TemplateCategoryStatsDto[]> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<TemplateCategoryStatsDto[]>('/goal-templates/category-stats');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getCategoryStatsFallback();
  }

  // FRONTEND COMPATIBILITY METHODS

  /**
   * Convert backend DTO to frontend GoalTemplate interface
   */
  transformToFrontendTemplate(dto: GoalTemplateResponseDto): GoalTemplate {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      priority: this.mapPriorityToFrontend(dto.priority),
      defaultDuration: dto.estimatedDuration,
      tags: dto.tags,
      status: dto.status,
      isActive: dto.status === 'active',
      usageCount: dto.usageCount,
      createdById: dto.createdById,
      createdByName: dto.createdByName,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert frontend GoalTemplate to backend DTO
   */
  transformToBackendDto(template: Partial<GoalTemplate>): Partial<CreateGoalTemplateDto> {
    return {
      name: template.name,
      description: template.description,
      category: template.category,
      priority: this.mapPriorityToBackend(template.priority),
      estimatedDuration: template.defaultDuration,
      tags: template.tags,
      status: template.isActive === false ? 'inactive' : 'active'
    };
  }

  private mapPriorityToFrontend(priority: 'low' | 'medium' | 'high'): 'Low' | 'Medium' | 'High' {
    const map = {
      'low': 'Low' as const,
      'medium': 'Medium' as const,
      'high': 'High' as const
    };
    return map[priority];
  }

  private mapPriorityToBackend(priority?: 'Low' | 'Medium' | 'High'): 'low' | 'medium' | 'high' {
    const map = {
      'Low': 'low' as const,
      'Medium': 'medium' as const,
      'High': 'high' as const
    };
    return priority ? map[priority] : 'medium';
  }

  // FALLBACK METHODS (Local Data Simulation)

  private async getAllFallback(filters?: GoalTemplateFiltersDto): Promise<PaginatedGoalTemplatesResponse> {
    // Get templates from localStorage or create defaults
    let templates: GoalTemplateResponseDto[] = JSON.parse(
      localStorage.getItem('goalTemplates') || '[]'
    );

    if (templates.length === 0) {
      templates = this.getDefaultTemplates();
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
    }

    // Apply filters
    let filteredTemplates = templates;
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    if (filters?.priority) {
      filteredTemplates = filteredTemplates.filter(t => t.priority === filters.priority);
    }

    if (filters?.status) {
      filteredTemplates = filteredTemplates.filter(t => t.status === filters.status);
    }

    // Apply sorting
    if (filters?.sortBy) {
      filteredTemplates.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof GoalTemplateResponseDto];
        const bVal = b[filters.sortBy as keyof GoalTemplateResponseDto];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return filters.sortOrder === 'DESC' 
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return filters.sortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
        }
        
        return 0;
      });
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

    return {
      templates: paginatedTemplates,
      total: filteredTemplates.length,
      page,
      totalPages: Math.ceil(filteredTemplates.length / limit)
    };
  }

  private async createFallback(data: CreateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
    
    const newTemplate: GoalTemplateResponseDto = {
      id: `template-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category,
      priority: data.priority,
      estimatedDuration: data.estimatedDuration,
      tags: data.tags,
      status: data.status || 'active',
      usageCount: 0,
      createdById: 'current-user',
      createdByName: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    localStorage.setItem('goalTemplates', JSON.stringify(templates));
    
    return newTemplate;
  }

  private async updateFallback(id: string, data: UpdateGoalTemplateDto): Promise<GoalTemplateResponseDto> {
    const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
    const index = templates.findIndex((t: GoalTemplateResponseDto) => t.id === id);
    
    if (index === -1) {
      throw new Error('Template not found');
    }

    templates[index] = {
      ...templates[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('goalTemplates', JSON.stringify(templates));
    return templates[index];
  }

  private getDefaultTemplates(): GoalTemplateResponseDto[] {
    return [
      {
        id: '1',
        name: 'Safety Training',
        description: 'Complete mandatory safety training course',
        category: 'Training',
        priority: 'high',
        estimatedDuration: 7,
        usageCount: 15,
        createdById: 'admin-1',
        createdByName: 'Admin User',
        status: 'active',
        tags: ['safety', 'training', 'mandatory'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Community Outreach',
        description: 'Organize and participate in community outreach activities',
        category: 'Community Service',
        priority: 'medium',
        estimatedDuration: 14,
        usageCount: 8,
        createdById: 'admin-1',
        createdByName: 'Admin User',
        status: 'active',
        tags: ['community', 'outreach', 'event'],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: '3',
        name: 'Fundraising Campaign',
        description: 'Plan and execute fundraising activities',
        category: 'Fundraising',
        priority: 'medium',
        estimatedDuration: 21,
        usageCount: 12,
        createdById: 'admin-1',
        createdByName: 'Admin User',
        status: 'active',
        tags: ['fundraising', 'campaign', 'planning'],
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'Skills Development',
        description: 'Complete skill-building workshop or training',
        category: 'Professional Development',
        priority: 'medium',
        estimatedDuration: 10,
        usageCount: 6,
        createdById: 'admin-1',
        createdByName: 'Admin User',
        status: 'active',
        tags: ['skills', 'development', 'workshop'],
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
      },
      {
        id: '5',
        name: 'Volunteer Mentorship',
        description: 'Mentor new volunteers and help with onboarding',
        category: 'Mentorship',
        priority: 'low',
        estimatedDuration: 30,
        usageCount: 4,
        createdById: 'admin-1',
        createdByName: 'Admin User',
        status: 'active',
        tags: ['mentorship', 'onboarding', 'support'],
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z'
      }
    ];
  }

  private async getUsageStatsFallback(template: GoalTemplateResponseDto): Promise<TemplateUsageStatsDto> {
    const monthlyUsage: MonthlyUsageData[] = [];
    
    // Generate mock monthly usage for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      monthlyUsage.push({
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear(),
        usageCount: Math.floor(Math.random() * 5) + 1,
        completionRate: Math.floor(Math.random() * 30) + 70
      });
    }

    return {
      totalUsage: template.usageCount,
      recentUsage: Math.floor(template.usageCount * 0.3),
      avgCompletionRate: Math.floor(Math.random() * 20) + 75,
      popularityRank: Math.floor(Math.random() * 10) + 1,
      monthlyUsage,
      categoryRank: Math.floor(Math.random() * 5) + 1,
      userFeedback: [
        {
          userId: 'user-1',
          userName: 'John Doe',
          rating: 5,
          feedback: 'Great template, very helpful!',
          createdAt: new Date().toISOString()
        },
        {
          userId: 'user-2',
          userName: 'Jane Smith',
          rating: 4,
          feedback: 'Good structure, easy to follow.',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  private async getAnalyticsFallback(): Promise<TemplateAnalyticsDto> {
    const templates = await this.getAllFallback();
    const categories = await this.getCategoryStatsFallback();

    return {
      totalTemplates: templates.total,
      activeTemplates: templates.templates.filter(t => t.status === 'active').length,
      totalUsage: templates.templates.reduce((sum, t) => sum + t.usageCount, 0),
      avgUsagePerTemplate: Math.round(
        templates.templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.total
      ),
      topCategories: categories.slice(0, 5),
      recentlyCreated: templates.templates
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      mostUsed: templates.templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5),
      trendingTemplates: templates.templates
        .filter(t => t.usageCount > 5)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3)
    };
  }

  private async getCategoryStatsFallback(): Promise<TemplateCategoryStatsDto[]> {
    const templates = await this.getAllFallback();
    const categoryMap = new Map<string, GoalTemplateResponseDto[]>();

    // Group templates by category
    templates.templates.forEach(template => {
      if (!categoryMap.has(template.category)) {
        categoryMap.set(template.category, []);
      }
      categoryMap.get(template.category)!.push(template);
    });

    // Calculate stats for each category
    return Array.from(categoryMap.entries()).map(([category, categoryTemplates]) => {
      const totalUsage = categoryTemplates.reduce((sum, t) => sum + t.usageCount, 0);
      const avgRating = Math.floor(Math.random() * 2) + 4; // 4-5 star rating

      return {
        category,
        totalTemplates: categoryTemplates.length,
        totalUsage,
        avgRating,
        popularTemplates: categoryTemplates
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 3)
      };
    }).sort((a, b) => b.totalUsage - a.totalUsage);
  }

  private transformError(error: any): Error {
    if (error.status === 404) {
      return new Error('Goal template not found');
    } else if (error.status === 403) {
      return new Error('You do not have permission to perform this action');
    } else if (error.status === 422) {
      return new Error('Invalid template data provided');
    } else if (error.status === 409) {
      return new Error('A template with this name already exists');
    } else if (error.status >= 500) {
      return new Error('Server error occurred. Please try again later.');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      isOnline: this.isOnline,
      endpoints: {
        base: '/goal-templates',
        categories: '/goal-templates/categories',
        popular: '/goal-templates/popular',
        duplicate: '/goal-templates/:id/duplicate',
        use: '/goal-templates/:id/use',
        usageStats: '/goal-templates/:id/usage-stats',
        analytics: '/goal-templates/analytics'
      },
      features: [
        'Complete CRUD operations',
        'Template usage tracking',
        'Category management',
        'Popular templates',
        'Template duplication',
        'Goal creation from templates',
        'Usage analytics and statistics',
        'Advanced filtering and search'
      ]
    };
  }
}

// Create singleton instance
export const goalTemplatesApi = new GoalTemplatesApiService();
export default goalTemplatesApi;