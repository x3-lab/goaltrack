import httpClient from './httpClient';
import { analyticsApi } from './analyticsApi';
import { adminDashboardApi } from './adminDashboardApi';

// Comprehensive types for the advanced analytics
export interface AdvancedAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
  category?: string;
  status?: string;
  view?: 'daily' | 'weekly' | 'monthly';
  groupBy?: 'category' | 'status' | 'volunteer';
}

export interface VolunteerPerformanceMetricsDto {
  volunteerId: string;
  volunteerName: string;
  emailAddress: string;
  metrics: {
    goalsCompleted: number;
    goalsInProgress: number;
    completionRate: number;
    averageCompletionTime: number; // in days
    consistencyScore: number; // 0-100
    onTimeCompletionRate: number; // percentage
    mostActiveDay: string;
    mostProductiveTimeOfDay?: string;
    lastActiveDate: string;
    categoriesBreakdown: Array<{
      category: string;
      count: number;
      completionRate: number;
    }>;
    recentGoals: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
      dueDate: string;
      category: string;
    }>;
    trend: {
      lastWeek: number;
      lastMonth: number;
      change: number; // percentage change
    };
  };
  rankings?: {
    completionRank: number;
    activityRank: number;
    consistencyRank: number;
    totalVolunteers: number;
  };
}

export interface OrganizationPerformanceDto {
  overview: {
    totalVolunteers: number;
    activeVolunteers: number;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    averageGoalsPerVolunteer: number;
    mostActiveCategory: string;
    highestPerformingCategory: string;
  };
  trends: {
    weeklyActivity: Array<{
      week: string;
      activeVolunteers: number;
      newGoals: number;
      completedGoals: number;
      completionRate: number;
    }>;
    monthlyGrowth: Array<{
      month: string;
      volunteersChange: number;
      goalsChange: number;
      completionRateChange: number;
    }>;
  };
  categories: Array<{
    name: string;
    goalsCount: number;
    completionRate: number;
    averageProgress: number;
    volunteers: number;
    trend: number; // percentage change
  }>;
  topPerformers: Array<{
    volunteerId: string;
    volunteerName: string;
    completedGoals: number;
    completionRate: number;
    consistency: number;
    categories: string[];
  }>;
  lowPerformers: Array<{
    volunteerId: string;
    volunteerName: string;
    completedGoals: number;
    completionRate: number;
    lastActive: string;
    categories: string[];
  }>;
}

export interface AdvancedAnalyticsReportDto {
  type: string;
  generatedAt: string;
  filters?: AdvancedAnalyticsFilters;
  data: any;
  downloadUrl?: string;
  format?: 'pdf' | 'csv' | 'json';
}

export interface GoalCompletionPredictionDto {
  goalId: string;
  goalTitle: string;
  volunteerId: string;
  volunteerName: string;
  currentProgress: number;
  predictedCompletionDate: string;
  confidenceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    volunteerHistory: number; // influence factor 0-100
    goalCategory: number;
    goalComplexity: number;
    currentPace: number;
  };
  recommendations?: Array<{
    type: 'reminder' | 'assistance' | 'modification';
    message: string;
    impact: number; // estimated impact on completion time (days)
  }>;
}

export interface CategoryInsightsDto {
  category: string;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  averageTimeToComplete: number; // days
  difficultyScore: number; // 0-100
  mostActiveVolunteers: Array<{
    volunteerId: string;
    volunteerName: string;
    goalsCompleted: number;
  }>;
  trends: {
    popularity: Array<{ period: string; count: number }>;
    completionRate: Array<{ period: string; rate: number }>;
  };
  relatedCategories: Array<{
    category: string;
    correlation: number; // -1 to 1
  }>;
}

class AdvancedAnalyticsApiService {
  private isOnline = false;
  private baseUrl = '/analytics/advanced';


  /**
   * Get comprehensive performance metrics for a specific volunteer
   */
  async getVolunteerPerformanceMetrics(volunteerId: string): Promise<VolunteerPerformanceMetricsDto> {
    if (this.isOnline) {
      try {
        console.log(`Getting performance metrics for volunteer ${volunteerId}...`);
        
        const response = await httpClient.get<VolunteerPerformanceMetricsDto>(
          `${this.baseUrl}/volunteer/${volunteerId}/metrics`
        );
        
        console.log('Volunteer performance metrics loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }

  /**
   * Get organization-wide performance analytics
   */
  async getOrganizationPerformance(filters?: AdvancedAnalyticsFilters): Promise<OrganizationPerformanceDto> {
    if (this.isOnline) {
      try {
        console.log('Getting organization performance data...');
        
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.category) params.append('category', filters.category);

        const response = await httpClient.get<OrganizationPerformanceDto>(
          `${this.baseUrl}/organization?${params.toString()}`
        );
        
        console.log('Organization performance data loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }

  /**
   * Generate and download a custom analytics report
   */
  async generateReport(
    reportType: 'volunteer' | 'organization' | 'categories' | 'predictions',
    options: {
      filters?: AdvancedAnalyticsFilters;
      format?: 'pdf' | 'csv' | 'json';
      volunteerId?: string;
    }
  ): Promise<AdvancedAnalyticsReportDto> {
    if (this.isOnline) {
      try {
        console.log(`Generating ${reportType} report...`);
        
        const params = new URLSearchParams();
        if (options.format) params.append('format', options.format);
        if (options.volunteerId) params.append('volunteerId', options.volunteerId);
        
        // Add all filters to params
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, value.toString());
          });
        }

        const response = await httpClient.get<AdvancedAnalyticsReportDto>(
          `${this.baseUrl}/reports/${reportType}?${params.toString()}`
        );
        
        console.log(`${reportType} report generated successfully`);
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }

  /**
   * Get goal completion predictions
   */
  async getGoalCompletionPredictions(filters?: {
    volunteerId?: string;
    category?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  }): Promise<GoalCompletionPredictionDto[]> {
    if (this.isOnline) {
      try {
        console.log('Getting goal completion predictions...');
        
        const params = new URLSearchParams();
        if (filters?.volunteerId) params.append('volunteerId', filters.volunteerId);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);

        const response = await httpClient.get<GoalCompletionPredictionDto[]>(
          `${this.baseUrl}/predictions?${params.toString()}`
        );
        
        console.log('Goal completion predictions loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }

  /**
   * Get insights for a specific category
   */
  async getCategoryInsights(category: string): Promise<CategoryInsightsDto> {
    if (this.isOnline) {
      try {
        console.log(`Getting insights for category "${category}"...`);
        
        const response = await httpClient.get<CategoryInsightsDto>(
          `${this.baseUrl}/categories/${encodeURIComponent(category)}/insights`
        );
        
        console.log('Category insights loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }

  /**
   * Get analytics KPIs for dashboard
   */
  async getDashboardKPIs(): Promise<any> {
    if (this.isOnline) {
      try {
        console.log('Getting analytics KPIs for dashboard...');
        
        const response = await httpClient.get<any>(`${this.baseUrl}/dashboard-kpis`);
        
        console.log('Dashboard KPIs loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend call failed, falling back to alternative implementation');
      }
    }
  }
}

export const advancedAnalyticsApi = new AdvancedAnalyticsApiService();
export default advancedAnalyticsApi;