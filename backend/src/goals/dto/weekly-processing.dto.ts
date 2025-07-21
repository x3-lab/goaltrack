export class WeeklyProcessingResultDto {
    processedGoals: number;
    completedGoals: number;
    overdueGoals: number;
    progressHistoryEntries: number;
    weekStart: Date;
    weekEnd: Date;
    processedAt: Date;
}