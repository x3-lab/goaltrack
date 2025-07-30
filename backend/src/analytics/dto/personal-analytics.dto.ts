export class AchievementDto {
    id: string;
    title: string;
    description: string;
    earnedDate: string;
    icon: string;
}

export class WeeklyTrendDto {
    week: string;
    completionRate: number;
    goalsCompleted: number;
    totalGoals: number;
}

export class CategoryStatDto {
    category: string;
    completionRate: number;
    totalGoals: number;
}

export class ProductiveDayDataDto {
    day: string;
    completedGoals: number;
}

export class PersonalAnalyticsDto {
    overallCompletionRate: number;
    performanceScore: number;
    streakCount: number;
    weeklyTrends: WeeklyTrendDto[];
    achievements: AchievementDto[];
    categoryStats: CategoryStatDto[];
    productiveData: ProductiveDayDataDto[];
}