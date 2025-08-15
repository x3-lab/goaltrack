// System Overview Types
export interface SystemOverviewDto {
  totalVolunteers: number;
  activeVolunteers: number;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  overdueGoals: number;
}

// Personal Analytics Types
export interface PersonalAnalyticsDto {
  overallCompletionRate: number;
  performanceScore: number;
  streakCount: number;
  weeklyTrends: WeeklyTrendDto[];
  achievements: AchievementDto[];
  categoryStats: CategoryStatDto[];
  productiveData: ProductiveDayDataDto[];
}

export interface WeeklyTrendDto {
  week: string;
  completionRate: number;
  goalsCompleted: number;
  totalGoals: number;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  icon: string;
}

export interface CategoryStatDto {
  category: string;
  completionRate: number;
  totalGoals: number;
}

export interface ProductiveDayDataDto {
  day: string;
  completedGoals: number;
}

// Analytics Data Types
export interface AnalyticsDataDto {
  overview: SystemOverviewDto;
  completionTrends: {
    daily: CompletionTrendDto[];
    weekly: CompletionTrendDto[];
  };
  performanceDistribution: PerformanceDistributionDto[];
  categoryBreakdown: CategoryBreakdownDto[];
  volunteerActivity: VolunteerActivityDto[];
}

export interface CompletionTrendDto {
  date: string;
  completed: number;
  total: number;
  period: string;
}

export interface PerformanceDistributionDto {
  name: string;
  value: number;
}

export interface CategoryBreakdownDto {
  name: string;
  value: number;
}

export interface VolunteerActivityDto {
  name: string;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
}

// Volunteer Performance Types
export interface VolunteerPerformanceDto {
  volunteerId: string;
  volunteerName: string;
  email: string;
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  completionRate: number;
  averageProgress: number;
  streakCount: number;
  lastActivityDate: string;
}

// Export Types
export interface ExportReportDto {
  data: any;
}

// Filter Types
export interface AnalyticsFiltersDto {
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
}

export interface PersonalAnalyticsFiltersDto {
  volunteerId: string;
  startDate?: string;
  endDate?: string;
}