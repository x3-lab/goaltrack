export class MonthlyChangesDto {
    volunteers: number;
    goals: number;
    completion: number;
    overdue: number;
}

export class DashboardStatsDto {
    activeVolunteers: number;
    totalGoals: number;
    completionRate: number;
    overdueGoals: number;
    monthlyChanges: MonthlyChangesDto;
}