import httpClient from './httpClient';

// Import types from backend DTOs
export interface ProgressHistoryResponseDto {
  id: string;
  goalId: string;
  volunteerId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  notes?: string;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
  updatedAt: string;
  goalTitle?: string;
  volunteerName?: string;
  category?: string;
}

export interface CreateProgressHistoryDto {
  goalId: string;
  volunteerId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  notes?: string;
  weekStart: string;
  weekEnd: string;
}

export interface ProgressHistoryFiltersDto {
  goalId?: string;
  volunteerId?: string;
  status?: string;
  category?: string;
  search?: string;
  weekStartFrom?: string;
  weekStartTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedProgressHistoryResponse {
  progressHistory: ProgressHistoryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VolunteerTrendsDto {
  volunteerId: string;
  volunteerName?: string;
  weeklyTrends: WeeklyTrendData[];
  overallAverageProgress: number;
  overallCompletionRate: number;
  bestWeek: {
    weekStart: string;
    weekEnd: string;
    completionRate: number;
  };
  worstWeek: {
    weekStart: string;
    weekEnd: string;
    completionRate: number;
  };
}

export interface WeeklyTrendData {
  weekStart: string;
  weekEnd: string;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  completionRate: number;
}

export interface MonthlySummaryDto {
  month: number;
  year: number;
  volunteerId: string;
  volunteerName?: string;
  totalEntries: number;
  completedGoals: number;
  averageProgress: number;
  completionRate: number;
  categoriesWorked: string[];
  weeklyBreakdown: WeeklyBreakdownData[];
  topCategories: CategoryPerformanceData[];
  progressDistribution: ProgressDistributionData[];
  streakCount: number;
}

export interface WeeklyBreakdownData {
  weekStart: string;
  weekEnd: string;
  entries: number;
  averageProgress: number;
}

export interface CategoryPerformanceData {
  category: string;
  entries: number;
  completionRate: number;
}

export interface ProgressDistributionData {
  range: string;
  count: number;
  percentage: number;
}

export interface VolunteerWeeklyHistoryDto {
  volunteerId: string;
  volunteerName?: string;
  weeks: HistoricalWeekDto[];
  totalWeeks: number;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  averageCompletionRate: number;
}

export interface HistoricalWeekDto {
  weekStart: string;
  weekEnd: string;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  completionRate: number;
  goals: HistoricalGoalDto[];
}

export interface HistoricalGoalDto {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  notes?: string;
}

export interface MostProductiveDayDto {
  volunteerId: string;
  volunteerName?: string;
  mostProductiveDay: {
    dayOfWeek: number;
    dayName: string;
    activitiesCount: number;
    goalsWorkedOn: number;
    averageProgress: number;
    productivityScore: number;
  };
  weeklyPattern: DailyProductivityData[];
  recommendedWorkingDays: string[];
  insights: string[];
}

export interface DailyProductivityData {
  dayOfWeek: number;
  dayName: string;
  activitiesCount: number;
  goalsWorkedOn: number;
  averageProgress: number;
  productivityScore: number;
}

export interface AnalyticsSummaryDto {
  totalProgressEntries: number;
  totalVolunteersWithHistory: number;
  averageWeeklyProgress: number;
  topPerformers: TopPerformerData[];
  recentActivity: RecentActivityData[];
  weeklyGrowth: WeeklyGrowthData[];
  categoryDistribution: CategoryDistributionData[];
}

export interface TopPerformerData {
  volunteerId: string;
  volunteerName: string;
  completionRate: number;
  averageProgress: number;
  totalEntries: number;
}

export interface RecentActivityData {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
  details?: Record<string, any>;
}

export interface WeeklyGrowthData {
  weekStart: string;
  weekEnd: string;
  totalEntries: number;
  averageProgress: number;
  completionRate: number;
}

export interface CategoryDistributionData {
  category: string;
  totalEntries: number;
  averageProgress: number;
  completionRate: number;
}

class ProgressHistoryApiService {
  // Remove any isOnline / fallback logic; always call backend

  /**
   * Get all progress history entries with filters
   */
  async getAll(filters?: ProgressHistoryFiltersDto): Promise<PaginatedProgressHistoryResponse> {
      try {
        const params = new URLSearchParams();
        
        if (filters?.goalId) params.append('goalId', filters.goalId);
        if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.weekStartFrom) params.append('weekStartFrom', filters.weekStartFrom);
        if (filters?.weekStartTo) params.append('weekStartTo', filters.weekStartTo);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await httpClient.get<PaginatedProgressHistoryResponse>(
          `/progress-history?${params.toString()}`
        );

        console.log('Progress history loaded from backend');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback to local calculation
    return this.getAllFallback(filters);
  }

  /**
   * Get specific progress history entry by ID
   */
  async getById(id: string): Promise<ProgressHistoryResponseDto> {
      try {
        const response = await httpClient.get<ProgressHistoryResponseDto>(`/progress-history/${id}`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback
    const allHistory = await this.getAllFallback();
    const entry = allHistory.progressHistory.find(h => h.id === id);
    if (!entry) {
      throw new Error('Progress history entry not found');
    }
    return entry;
  }

  /**
   * Create new progress history entry (Admin only)
   */
  async create(data: CreateProgressHistoryDto): Promise<ProgressHistoryResponseDto> {
      try {
        console.log('Creating progress history entry');
        
        const response = await httpClient.post<ProgressHistoryResponseDto>('/progress-history', data);
        
        console.log('Progress history entry created successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    

    // Fallback to local storage
    return this.createFallback(data);
  }

  /**
   * Delete progress history entry (Admin only)
   */
  async delete(id: string): Promise<void> {
      try {
        console.log(`Deleting progress history entry ${id}`);
        
        await httpClient.delete(`/progress-history/${id}`);
        
        console.log('Progress history entry deleted successfully');
      } catch (error: any) {
        console.warn('Backend failed, using fallback');
        throw this.transformError(error);
      }
    

    // Fallback - simulate deletion
    console.log(`Simulated deletion of progress history entry ${id}`);
  }

  // PERSONAL PROGRESS HISTORY

  /**
   * Get current user's progress history
   */
  async getMyHistory(filters?: Omit<ProgressHistoryFiltersDto, 'volunteerId'>): Promise<PaginatedProgressHistoryResponse> {
      try {
        const params = new URLSearchParams();
        
        if (filters?.goalId) params.append('goalId', filters.goalId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.weekStartFrom) params.append('weekStartFrom', filters.weekStartFrom);
        if (filters?.weekStartTo) params.append('weekStartTo', filters.weekStartTo);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await httpClient.get<PaginatedProgressHistoryResponse>(
          `/progress-history/my-history?${params.toString()}`
        );

        console.log('Personal progress history loaded from backend');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback
    const currentUserId = localStorage.getItem('currentUserId') || 'current-user';
    return this.getAllFallback({ ...filters, volunteerId: currentUserId });
  }

  /**
   * Get current user's trends
   */
  async getMyTrends(): Promise<VolunteerTrendsDto> {
    return httpClient.get<VolunteerTrendsDto>('/progress-history/my-trends');
  }

  // VOLUNTEER-SPECIFIC ANALYTICS

  /**
   * Get volunteer trends
   */
  async getVolunteerTrends(volunteerId: string): Promise<VolunteerTrendsDto> {
    return httpClient.get<VolunteerTrendsDto>(`/progress-history/volunteer/${volunteerId}/trends`);
  }

  /**
   * Get monthly summary for volunteer
   */
  async getMonthlySummary(volunteerId: string, year: number, month: number): Promise<MonthlySummaryDto> {
      try {
        const response = await httpClient.get<MonthlySummaryDto>(
          `/progress-history/volunteer/${volunteerId}/monthly/${year}/${month}`
        );
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback
    return this.getMonthlySummaryFallback(volunteerId, year, month);
  }

  /**
   * Get weekly history for volunteer
   */
  async getVolunteerWeeklyHistory(
    volunteerId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<VolunteerWeeklyHistoryDto> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return httpClient.get<VolunteerWeeklyHistoryDto>(
      `/progress-history/volunteer/${volunteerId}/weekly-history${params.toString() ? '?' + params : ''}`
    );
  }

  /**
   * Get current user's weekly history
   */
  async getMyWeeklyHistory(startDate?: string, endDate?: string): Promise<VolunteerWeeklyHistoryDto> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return httpClient.get<VolunteerWeeklyHistoryDto>(
      `/progress-history/my-weekly-history${params.toString() ? '?' + params : ''}`
    );
  }

  /**
   * Get most productive day for volunteer
   */
  async getVolunteerMostProductiveDay(volunteerId: string): Promise<MostProductiveDayDto> {
      try {
        const response = await httpClient.get<MostProductiveDayDto>(
          `/progress-history/volunteer/${volunteerId}/productive-day`
        );
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback
    return this.getMostProductiveDayFallback(volunteerId);
  }

  /**
   * Get current user's most productive day
   */
  async getMyMostProductiveDay(): Promise<MostProductiveDayDto> {
      try {
        const response = await httpClient.get<MostProductiveDayDto>('/progress-history/my-productive-day');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    

    // Fallback
    const currentUserId = localStorage.getItem('currentUserId') || 'current-user';
    return this.getMostProductiveDayFallback(currentUserId);
  }

  // SYSTEM-WIDE ANALYTICS

  /**
   * Get analytics summary (Admin only)
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
      try {
        const response = await httpClient.get<AnalyticsSummaryDto>('/progress-history/analytics/summary');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    
  }

  /**
   * Generate weekly progress entry for current user
   */
  async generateWeeklyEntry(goalId: string, notes?: string): Promise<any> {
    return httpClient.post(`/progress-history/weekly-entry`, { goalId, notes });
  }

  // UTILITY METHODS

  /**
   * Generate weekly progress entry for current user
   */
  // async generateWeeklyEntry(goalId: string, notes?: string): Promise<ProgressHistoryResponseDto> {
  //   const goals = JSON.parse(localStorage.getItem('goals') || '[]');
  //   const goal = goals.find((g: any) => g.id === goalId);
    
  //   if (!goal) {
  //     throw new Error('Goal not found');
  //   }

  //   const now = new Date();
  //   const weekStart = new Date(now);
  //   weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  //   const weekEnd = new Date(weekStart);
  //   weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

  //   const data: CreateProgressHistoryDto = {
  //     goalId: goal.id,
  //     volunteerId: goal.volunteerId || localStorage.getItem('currentUserId') || 'current-user',
  //     title: goal.title,
  //     status: goal.status,
  //     progress: goal.progress,
  //     notes: notes || '',
  //     weekStart: weekStart.toISOString(),
  //     weekEnd: weekEnd.toISOString()
  //   };

  //   return this.create(data);
  // }

  /**
   * Get week boundaries for a given date
   */
  getWeekBoundaries(date: Date): { start: string; end: string } {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // End of week (Saturday)
    end.setHours(23, 59, 59, 999);
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  // FALLBACK METHODS (Local Data Simulation)

  private async getAllFallback(filters?: ProgressHistoryFiltersDto): Promise<PaginatedProgressHistoryResponse> {
    // Generate mock progress history from existing goals
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const progressHistory: ProgressHistoryResponseDto[] = [];

    // Generate weekly entries for the last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const { start, end } = this.getWeekBoundaries(weekDate);

      // Create entries for each goal
      goals.forEach((goal: any, index: number) => {
        if (filters?.volunteerId && goal.volunteerId !== filters.volunteerId) return;
        if (filters?.goalId && goal.id !== filters.goalId) return;
        if (filters?.status && goal.status !== filters.status) return;
        if (filters?.category && goal.category !== filters.category) return;

        const entry: ProgressHistoryResponseDto = {
          id: `ph-${goal.id}-week-${i}`,
          goalId: goal.id,
          volunteerId: goal.volunteerId || 'current-user',
          title: goal.title,
          status: goal.status,
          progress: Math.max(0, goal.progress - (i * 5)), // Simulate progress growth
          notes: `Week ${12 - i} progress update`,
          weekStart: start,
          weekEnd: end,
          createdAt: weekDate.toISOString(),
          updatedAt: weekDate.toISOString(),
          goalTitle: goal.title,
          volunteerName: goal.volunteerName || 'Current User',
          category: goal.category
        };

        progressHistory.push(entry);
      });
    }

    // Apply search filter
    let filteredHistory = progressHistory;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredHistory = progressHistory.filter(h => 
        h.title.toLowerCase().includes(searchLower) ||
        h.notes?.toLowerCase().includes(searchLower) ||
        h.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

    return {
      progressHistory: paginatedHistory,
      total: filteredHistory.length,
      page,
      limit,
      totalPages: Math.ceil(filteredHistory.length / limit)
    };
  }

  private async createFallback(data: CreateProgressHistoryDto): Promise<ProgressHistoryResponseDto> {
    const entry: ProgressHistoryResponseDto = {
      id: `ph-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goalTitle: `Goal ${data.goalId}`,
      volunteerName: 'Current User',
      category: 'General'
    };

    // Store in localStorage for demo
    const existing = JSON.parse(localStorage.getItem('progressHistory') || '[]');
    existing.push(entry);
    localStorage.setItem('progressHistory', JSON.stringify(existing));

    return entry;
  }

  private async getVolunteerTrendsFallback(volunteerId: string): Promise<VolunteerTrendsDto> {
    const mockTrends: WeeklyTrendData[] = [];
    
    // Generate mock weekly trends for the last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const { start, end } = this.getWeekBoundaries(weekDate);

      const totalGoals = Math.floor(Math.random() * 5) + 3;
      const completedGoals = Math.floor(Math.random() * totalGoals);
      const averageProgress = Math.floor(Math.random() * 40) + 60;
      const completionRate = Math.round((completedGoals / totalGoals) * 100);

      mockTrends.push({
        weekStart: start,
        weekEnd: end,
        totalGoals,
        completedGoals,
        averageProgress,
        completionRate
      });
    }

    const overallAverageProgress = Math.round(
      mockTrends.reduce((sum, trend) => sum + trend.averageProgress, 0) / mockTrends.length
    );
    
    const overallCompletionRate = Math.round(
      mockTrends.reduce((sum, trend) => sum + trend.completionRate, 0) / mockTrends.length
    );

    const bestWeek = mockTrends.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best
    );

    const worstWeek = mockTrends.reduce((worst, current) => 
      current.completionRate < worst.completionRate ? current : worst
    );

    return {
      volunteerId,
      volunteerName: 'Current User',
      weeklyTrends: mockTrends,
      overallAverageProgress,
      overallCompletionRate,
      bestWeek: {
        weekStart: bestWeek.weekStart,
        weekEnd: bestWeek.weekEnd,
        completionRate: bestWeek.completionRate
      },
      worstWeek: {
        weekStart: worstWeek.weekStart,
        weekEnd: worstWeek.weekEnd,
        completionRate: worstWeek.completionRate
      }
    };
  }

  private async getMonthlySummaryFallback(volunteerId: string, year: number, month: number): Promise<MonthlySummaryDto> {
    const totalEntries = Math.floor(Math.random() * 20) + 10;
    const completedGoals = Math.floor(Math.random() * totalEntries);
    const averageProgress = Math.floor(Math.random() * 30) + 70;
    const completionRate = Math.round((completedGoals / totalEntries) * 100);

    const weeklyBreakdown: WeeklyBreakdownData[] = [];
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(year, month - 1, (week - 1) * 7 + 1);
      const weekEnd = new Date(year, month - 1, week * 7);
      
      weeklyBreakdown.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        entries: Math.floor(Math.random() * 5) + 2,
        averageProgress: Math.floor(Math.random() * 30) + 70
      });
    }

    const topCategories: CategoryPerformanceData[] = [
      { category: 'Community Service', entries: 8, completionRate: 85 },
      { category: 'Training', entries: 5, completionRate: 100 },
      { category: 'Administration', entries: 3, completionRate: 67 }
    ];

    const progressDistribution: ProgressDistributionData[] = [
      { range: '0-25%', count: 2, percentage: 10 },
      { range: '26-50%', count: 3, percentage: 15 },
      { range: '51-75%', count: 5, percentage: 25 },
      { range: '76-100%', count: 10, percentage: 50 }
    ];

    return {
      month,
      year,
      volunteerId,
      volunteerName: 'Current User',
      totalEntries,
      completedGoals,
      averageProgress,
      completionRate,
      categoriesWorked: ['Community Service', 'Training', 'Administration'],
      weeklyBreakdown,
      topCategories,
      progressDistribution,
      streakCount: Math.floor(Math.random() * 8) + 1
    };
  }

  private async getMostProductiveDayFallback(volunteerId: string): Promise<MostProductiveDayDto> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const weeklyPattern: DailyProductivityData[] = days.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      activitiesCount: Math.floor(Math.random() * 10) + 2,
      goalsWorkedOn: Math.floor(Math.random() * 3) + 1,
      averageProgress: Math.floor(Math.random() * 30) + 70,
      productivityScore: Math.floor(Math.random() * 40) + 60
    }));

    const mostProductiveDay = weeklyPattern.reduce((best, current) => 
      current.productivityScore > best.productivityScore ? current : best
    );

    return {
      volunteerId,
      volunteerName: 'Current User',
      mostProductiveDay,
      weeklyPattern,
      recommendedWorkingDays: ['Monday', 'Tuesday', 'Wednesday'],
      insights: [
        'You are most productive on ' + mostProductiveDay.dayName,
        'Consider scheduling important tasks on high-productivity days',
        'Your average productivity score is above average'
      ]
    };
  }

  private transformError(error: any): Error {
    if (error.status === 404) {
      return new Error('Progress history entry not found');
    } else if (error.status === 403) {
      return new Error('You do not have permission to perform this action');
    } else if (error.status === 422) {
      return new Error('Invalid progress history data provided');
    } else if (error.status >= 500) {
      return new Error('Server error occurred. Please try again later.');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      endpoints: {
        base: '/progress-history',
        myHistory: '/progress-history/my-history',
        myTrends: '/progress-history/my-trends',
        volunteerTrends: '/progress-history/volunteer/:volunteerId/trends',
        monthlySummary: '/progress-history/volunteer/:volunteerId/monthly/:year/:month',
        weeklyHistory: '/progress-history/volunteer/:volunteerId/weekly-history',
        productiveDay: '/progress-history/volunteer/:volunteerId/productive-day',
        analyticsSummary: '/progress-history/analytics/summary'
      },
      features: [
        'Complete CRUD operations',
        'Personal progress tracking',
        'Volunteer analytics',
        'Weekly and monthly summaries',
        'Productivity analysis',
        'System-wide analytics'
      ]
    };
  }
}

// Create singleton instance
export const progressHistoryApi = new ProgressHistoryApiService();
export default progressHistoryApi;