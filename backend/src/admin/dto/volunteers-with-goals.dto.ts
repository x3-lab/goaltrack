export class VolunteerWithGoalsDto {
    volunteerId: string;
    volunteerName: string;
    volunteerEmail: string;
    totalGoals: number;
    completedGoals: number;
    pendingGoals: number;
    inProgressGoals: number;
    completionRate: number;
    lastActivity: string;
    recentGoals: Array<{
        id: string;
        title: string;
        status: string;
        progress: number;
        dueDate: string;
    }>;
}