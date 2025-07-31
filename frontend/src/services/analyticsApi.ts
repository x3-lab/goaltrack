import httpClient from './httpClient';
import type { 
  SystemOverviewDto,
  PersonalAnalyticsDto,
  AnalyticsDataDto,
  VolunteerPerformanceDto,
  ExportReportDto
} from '../types/analytics';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
}

export interface PersonalAnalyticsFilters {
  volunteerId: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportRequest {
  type: 'overview' | 'performance' | 'goals';
  filters?: AnalyticsFilters;
}

class AnalyticsApiService {
  private isOnline = false;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await httpClient.get('/analytics/system-overview');
      this.isOnline = true;
      console.log('✅ Analytics API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('🔄 Analytics API using fallback mode');
    }
  }

  // SYSTEM ANALYTICS METHODS

  /**
   * Get system overview statistics
   */
  async getSystemOverview(filters?: AnalyticsFilters): Promise<SystemOverviewDto> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<SystemOverviewDto>(
          `/analytics/system-overview?${params.toString()}`
        );

        console.log('✅ System overview loaded from backend');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback to local calculation
    return this.getSystemOverviewFallback(filters);
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(filters?: AnalyticsFilters): Promise<AnalyticsDataDto> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<AnalyticsDataDto>(
          `/analytics/data?${params.toString()}`
        );

        console.log('✅ Analytics data loaded from backend');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback to local calculation
    return this.getAnalyticsDataFallback(filters);
  }

  /**
   * Get completion trends
   */
  async getCompletionTrends(filters?: AnalyticsFilters): Promise<AnalyticsDataDto['completionTrends']> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<AnalyticsDataDto['completionTrends']>(
          `/analytics/completion-trends?${params.toString()}`
        );

        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const fullData = await this.getAnalyticsDataFallback(filters);
    return fullData.completionTrends;
  }

  /**
   * Get performance distribution
   */
  async getPerformanceDistribution(): Promise<AnalyticsDataDto['performanceDistribution']> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<AnalyticsDataDto['performanceDistribution']>(
          '/analytics/performance-distribution'
        );

        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const fullData = await this.getAnalyticsDataFallback();
    return fullData.performanceDistribution;
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(filters?: AnalyticsFilters): Promise<AnalyticsDataDto['categoryBreakdown']> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<AnalyticsDataDto['categoryBreakdown']>(
          `/analytics/category-breakdown?${params.toString()}`
        );

        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const fullData = await this.getAnalyticsDataFallback(filters);
    return fullData.categoryBreakdown;
  }

  /**
   * Get volunteer activity
   */
  async getVolunteerActivity(filters?: AnalyticsFilters): Promise<AnalyticsDataDto['volunteerActivity']> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<AnalyticsDataDto['volunteerActivity']>(
          `/analytics/volunteer-activity?${params.toString()}`
        );

        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    const fullData = await this.getAnalyticsDataFallback(filters);
    return fullData.volunteerActivity;
  }

  /**
   * Get volunteer performance metrics
   */
  async getVolunteerPerformance(): Promise<VolunteerPerformanceDto[]> {
    if (this.isOnline) {
      try {
        const response = await httpClient.get<VolunteerPerformanceDto[]>(
          '/analytics/volunteer-performance'
        );

        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getVolunteerPerformanceFallback();
  }

  // PERSONAL ANALYTICS METHODS

  /**
   * Get personal analytics for a specific volunteer
   */
  async getPersonalAnalytics(filters: PersonalAnalyticsFilters): Promise<PersonalAnalyticsDto> {
    if (this.isOnline) {
      try {
        const params = new URLSearchParams();
        params.append('volunteerId', filters.volunteerId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await httpClient.get<PersonalAnalyticsDto>(
          `/analytics/personal/${filters.volunteerId}?${params.toString()}`
        );

        console.log(`✅ Personal analytics loaded for volunteer ${filters.volunteerId}`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback to local calculation
    return this.getPersonalAnalyticsFallback(filters);
  }

  // EXPORT METHODS

  /**
   * Export analytics report
   */
  async exportReport(request: ExportRequest): Promise<ExportReportDto> {
    if (this.isOnline) {
      try {
        const response = await httpClient.post<ExportReportDto>(
          '/analytics/export',
          request
        );

        console.log(`✅ Report exported: ${request.type}`);
        return response;
      } catch (error: any) {
        console.warn('Backend export failed, generating local export');
      }
    }

    // Fallback to local export generation
    return this.generateLocalExport(request);
  }

  // UTILITY METHODS

  /**
   * Get date range for common filters
   */
  getDateRange(range: '7days' | '30days' | '90days' | '1year'): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '90days':
        start.setDate(now.getDate() - 90);
        break;
      case '1year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  // FALLBACK METHODS (Local Data Calculation)

  private async getSystemOverviewFallback(filters?: AnalyticsFilters): Promise<SystemOverviewDto> {
    // Load local data
    const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');

    // Apply date filters if provided
    let filteredGoals = goals;
    if (filters?.startDate || filters?.endDate) {
      filteredGoals = goals.filter((goal: any) => {
        const goalDate = new Date(goal.createdAt);
        if (filters.startDate && goalDate < new Date(filters.startDate)) return false;
        if (filters.endDate && goalDate > new Date(filters.endDate)) return false;
        return true;
      });
    }

    const totalVolunteers = volunteers.length;
    const activeVolunteers = volunteers.filter((v: any) => v.status === 'active').length;
    const totalGoals = filteredGoals.length;
    const completedGoals = filteredGoals.filter((g: any) => g.status === 'completed').length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const overdueGoals = filteredGoals.filter((g: any) => g.status === 'overdue').length;

    return {
      totalVolunteers,
      activeVolunteers,
      totalGoals,
      completedGoals,
      completionRate,
      overdueGoals
    };
  }

  private async getAnalyticsDataFallback(filters?: AnalyticsFilters): Promise<AnalyticsDataDto> {
    const overview = await this.getSystemOverviewFallback(filters);
    
    // Generate mock completion trends
    const completionTrends = this.generateMockCompletionTrends();
    
    // Generate mock performance distribution
    const performanceDistribution = [
      { name: 'High Performers', value: 25 },
      { name: 'Medium Performers', value: 50 },
      { name: 'Low Performers', value: 25 }
    ];

    // Generate mock category breakdown
    const categoryBreakdown = [
      { name: 'Community Service', value: 35 },
      { name: 'Environmental', value: 25 },
      { name: 'Education', value: 20 },
      { name: 'Healthcare', value: 15 },
      { name: 'Technology', value: 5 }
    ];

    // Generate mock volunteer activity
    const volunteerActivity = await this.generateMockVolunteerActivity();

    return {
      overview,
      completionTrends,
      performanceDistribution,
      categoryBreakdown,
      volunteerActivity
    };
  }

  private generateMockCompletionTrends(): { daily: any[]; weekly: any[] } {
    const daily = [];
    const weekly = [];

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      daily.push({
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 10) + 5,
        total: Math.floor(Math.random() * 15) + 10,
        period: date.toLocaleDateString()
      });
    }

    // Generate last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      
      weekly.push({
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 50) + 30,
        total: Math.floor(Math.random() * 70) + 50,
        period: `Week of ${date.toLocaleDateString()}`
      });
    }

    return { daily, weekly };
  }

  private async generateMockVolunteerActivity(): Promise<any[]> {
    const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
    
    return volunteers.slice(0, 10).map((volunteer: any) => ({
      name: volunteer.name,
      totalGoals: Math.floor(Math.random() * 20) + 5,
      completedGoals: Math.floor(Math.random() * 15) + 3,
      completionRate: Math.floor(Math.random() * 40) + 60
    }));
  }

  private async getVolunteerPerformanceFallback(): Promise<VolunteerPerformanceDto[]> {
    const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
    
    return volunteers.map((volunteer: any) => ({
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email,
      totalGoals: Math.floor(Math.random() * 20) + 5,
      completedGoals: Math.floor(Math.random() * 15) + 3,
      completionRate: Math.floor(Math.random() * 40) + 60,
      averageProgress: Math.floor(Math.random() * 30) + 70,
      streakCount: Math.floor(Math.random() * 10) + 1,
      lastActivityDate: new Date().toISOString()
    }));
  }

  private async getPersonalAnalyticsFallback(filters: PersonalAnalyticsFilters): Promise<PersonalAnalyticsDto> {
    // Generate mock personal analytics
    return {
      overallCompletionRate: Math.floor(Math.random() * 30) + 70,
      performanceScore: Math.floor(Math.random() * 20) + 80,
      streakCount: Math.floor(Math.random() * 10) + 1,
      weeklyTrends: this.generateMockWeeklyTrends(),
      achievements: this.generateMockAchievements(),
      categoryStats: this.generateMockCategoryStats(),
      productiveData: this.generateMockProductiveData()
    };
  }

  private generateMockWeeklyTrends(): any[] {
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      
      trends.push({
        week: date.toISOString().split('T')[0],
        completionRate: Math.floor(Math.random() * 40) + 60,
        goalsCompleted: Math.floor(Math.random() * 5) + 2,
        totalGoals: Math.floor(Math.random() * 8) + 4
      });
    }
    return trends;
  }

  private generateMockAchievements(): any[] {
    return [
      {
        id: '1',
        title: 'First Goal Completed',
        description: 'Completed your first goal!',
        earnedDate: new Date().toISOString(),
        icon: '🎯'
      },
      {
        id: '2',
        title: 'Goal Achiever',
        description: 'Completed 5 goals',
        earnedDate: new Date().toISOString(),
        icon: '⭐'
      }
    ];
  }

  private generateMockCategoryStats(): any[] {
    return [
      { category: 'Community Service', completionRate: 85, totalGoals: 12 },
      { category: 'Environmental', completionRate: 75, totalGoals: 8 },
      { category: 'Education', completionRate: 90, totalGoals: 6 }
    ];
  }

  private generateMockProductiveData(): any[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => ({
      day,
      completedGoals: Math.floor(Math.random() * 5) + 1
    }));
  }

  private async generateLocalExport(request: ExportRequest): Promise<ExportReportDto> {
    let data: any;

    switch (request.type) {
      case 'overview':
        data = await this.getSystemOverviewFallback(request.filters);
        break;
      case 'performance':
        data = await this.getVolunteerPerformanceFallback();
        break;
      case 'goals':
        data = await this.getAnalyticsDataFallback(request.filters);
        break;
      default:
        data = await this.getSystemOverviewFallback(request.filters);
    }

    return { data };
  }

  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      isOnline: this.isOnline,
      endpoints: {
        systemOverview: '/analytics/system-overview',
        analyticsData: '/analytics/data',
        personalAnalytics: '/analytics/personal/:volunteerId',
        export: '/analytics/export'
      }
    };
  }
}

// Create singleton instance
export const analyticsApi = new AnalyticsApiService();
export default analyticsApi;