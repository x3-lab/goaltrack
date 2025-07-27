export class VolunteerTrendsDto {
    volunteerId: string;
    volunteerName: string;
    weeklyTrends: {
        weekStart: Date;
        weekEnd: Date;
        totalGoals: number;
        completedGoals: number;
        averageProgress: number;
        completionRate: number;
    }[];
    overallStats: {
        totalEntries: number;
        averageProgress: number;
        completionRate: number;
        bestWeek: {
            weekStart: Date;
            completionRate: number;
        } | null;
        improvementTrend: 'improving' | 'declining' | 'stable';
    };
}