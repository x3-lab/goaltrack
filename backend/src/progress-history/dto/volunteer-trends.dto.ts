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