import httpClient from './httpClient';

// Import types from backend DTOs
export interface ProgressHistoryResponseDto {
  id: string;
  goalId: string;
  volunteerId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
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
  overallStats: {
    totalGoals: number;
    completedGoals: number;
    averageProgress: number;
    averageCompletionRate: number;
  }
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
  // STATUS NORMALIZATION (backend may return in_progress / IN_PROGRESS)
  private mapStatus(raw?: string): any {
    if (!raw) return raw;
    const r = raw.toLowerCase();
    if (r === 'in_progress') return 'in-progress';
    return r.replace('__', '-'); // safety
  }

  private normalizeEntry(e: ProgressHistoryResponseDto): ProgressHistoryResponseDto {
    return {
      ...e,
      status: this.mapStatus(e.status)
    };
  }

  private normalizeHistory(list: ProgressHistoryResponseDto[]): ProgressHistoryResponseDto[] {
    return list.map(e => this.normalizeEntry(e));
  }

  /**
   * Get all progress history entries with filters
   */
  async getAll(filters?: ProgressHistoryFiltersDto): Promise<PaginatedProgressHistoryResponse> {
    const params = new URLSearchParams();
    if (filters?.goalId) params.append('goalId', filters.goalId);
    if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.weekStartFrom) params.append('weekStartFrom', filters.weekStartFrom);
    if (filters?.weekStartTo) params.append('weekStartTo', filters.weekStartTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder!);

    const res = await httpClient.get<PaginatedProgressHistoryResponse>(`/progress-history?${params}`);
    res.progressHistory = this.normalizeHistory(res.progressHistory);
    return res;
  }

  /**
   * Get specific progress history entry by ID
   */
  async getById(id: string): Promise<ProgressHistoryResponseDto> {
    const res = await httpClient.get<ProgressHistoryResponseDto>(`/progress-history/${id}`);
    return this.normalizeEntry(res);
  }

  /**
   * Create new progress history entry (Admin only)
   */
  async create(data: CreateProgressHistoryDto): Promise<ProgressHistoryResponseDto> {
    const res = await httpClient.post<ProgressHistoryResponseDto>('/progress-history', data);
    return this.normalizeEntry(res);
  }

  /**
   * Delete progress history entry (Admin only)
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/progress-history/${id}`);
  }

  // PERSONAL PROGRESS HISTORY

  /**
   * Get current user's progress history
   */
  async getMyHistory(filters?: Omit<ProgressHistoryFiltersDto, 'volunteerId'>): Promise<PaginatedProgressHistoryResponse> {
    const params = new URLSearchParams();
    if (filters?.goalId) params.append('goalId', filters.goalId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.weekStartFrom) params.append('weekStartFrom', filters.weekStartFrom);
    if (filters?.weekStartTo) params.append('weekStartTo', filters.weekStartTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder!);

    const res = await httpClient.get<PaginatedProgressHistoryResponse>(`/progress-history/my-history?${params}`);
    res.progressHistory = this.normalizeHistory(res.progressHistory);
    return res;
  }

  /**
   * Get current user's trends
   */
  async getMyTrends(): Promise<VolunteerTrendsDto> {
    const res = await httpClient.get<VolunteerTrendsDto>('/progress-history/my-trends');
    res.weeklyTrends = res.weeklyTrends || [];
    return res;
  }

  // VOLUNTEER-SPECIFIC ANALYTICS

  /**
   * Get volunteer trends
   */
  async getVolunteerTrends(volunteerId: string): Promise<VolunteerTrendsDto> {
    const res = await httpClient.get<VolunteerTrendsDto>(`/progress-history/volunteer/${volunteerId}/trends`);
    res.weeklyTrends = res.weeklyTrends || [];
    return res;
  }

  /**
   * Get monthly summary for volunteer
   */
  async getMonthlySummary(volunteerId: string, year: number, month: number): Promise<MonthlySummaryDto> {
    return httpClient.get<MonthlySummaryDto>(`/progress-history/volunteer/${volunteerId}/monthly/${year}/${month}`);
  }

  /**
   * Get weekly history for volunteer
   */
  async getVolunteerWeeklyHistory(volunteerId: string, startDate?: string, endDate?: string): Promise<VolunteerWeeklyHistoryDto> {
    const qs = new URLSearchParams();
    if (startDate) qs.append('startDate', startDate);
    if (endDate) qs.append('endDate', endDate);
    return httpClient.get<VolunteerWeeklyHistoryDto>(`/progress-history/volunteer/${volunteerId}/weekly-history${qs.size ? '?' + qs : ''}`);
  }

  /**
   * Get current user's weekly history
   */
  async getMyWeeklyHistory(startDate?: string, endDate?: string): Promise<VolunteerWeeklyHistoryDto> {
    const qs = new URLSearchParams();
    if (startDate) qs.append('startDate', startDate);
    if (endDate) qs.append('endDate', endDate);
    return httpClient.get<VolunteerWeeklyHistoryDto>(`/progress-history/my-weekly-history${qs.size ? '?' + qs : ''}`);
  }

  /**
   * Get most productive day for volunteer
   */
  async getVolunteerMostProductiveDay(volunteerId: string): Promise<MostProductiveDayDto> {
    return httpClient.get<MostProductiveDayDto>(`/progress-history/volunteer/${volunteerId}/productive-day`);
  }

  /**
   * Get current user's most productive day
   */
  async getMyMostProductiveDay(): Promise<MostProductiveDayDto> {
    return httpClient.get<MostProductiveDayDto>('/progress-history/my-productive-day');
  }

  // SYSTEM-WIDE ANALYTICS

  /**
   * Get analytics summary (Admin only)
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
    return httpClient.get<AnalyticsSummaryDto>('/progress-history/analytics/summary');
  }

  getWeekBoundaries = (date: Date): { start: string; end: string } => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    
    const start = new Date(d.setDate(diff));
    const end = new Date(d.setDate(diff + 6));
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

}

// Create singleton instance
export const progressHistoryApi = new ProgressHistoryApiService();
export default progressHistoryApi;