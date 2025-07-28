export class CompletionTrendDto {
    date: string;
    completed: number;
    total: number;
    period: string;
}

export class PerformanceDistributionDto {
    name: string;
    value: number;
}

export class CategoryBreakdownDto {
    name: string;
    value: number;
}

export class VolunteerActivityDto {
    name: string;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
}

export class AnalyticsDataDto {
    overview: {
        totalVolunteers: number;
        activeVolunteers: number;
        totalGoals: number;
        completedGoals: number;
        completionRate: number;
        overdueGoals: number;
    };
    completionTrends: {
        daily: CompletionTrendDto[];
        weekly: CompletionTrendDto[];
    };
    performanceDistribution: PerformanceDistributionDto[];
    categoryBreakdown: CategoryBreakdownDto[];
    volunteerActivity: VolunteerActivityDto[];
}