export class MonthlySummaryDto {
    month: string;
    year: number;
    volunteerId?: string;
    summary: {
        totalEntries: number;
        completedGoals: number;
        averageProgress:number;
        completionRate:number;
        categoriesWorked: string[];
        weeklyBreakdown: {
            weekStart: Date;
            weekEnd: Date;
            entries: number;
            averageProgress: number;
        }[];
    };
    topCategories: {
        category: string;
        entries: number;
        completionRate: number;
    }[];
    progressDistribution:{
        range: string;
        count: number;
        percentage: number;
    }[];
}