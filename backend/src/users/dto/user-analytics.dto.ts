export class UserAnalyticsDto {
    userId: string;
    totalGoals: number;
    completedGoals: number;
    pendingGoals: number;
    overdueGoals: number;
    completionRate: number;
    averageProgress: number;
    goalsThisMonth: number;
    goalsLastMonth: number;
    monthlyGrowth: number;
    categoryBreakdown: {
        category: string;
        count: number;
        completionRate: number;
    }[];
    recentActivity:{
        date: Date;
        action: string;
        goalTitle: string | undefined;
    }[];
    performanceTrend: {
        month: string;
        completionRate: number;
        goalsCompleted: number;
    }[];
}