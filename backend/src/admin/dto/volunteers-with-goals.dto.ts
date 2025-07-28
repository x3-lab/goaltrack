export class VolunteerWithGoalsDto {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    role: string;
    joinDate: string;
    lastActive: string;
    performance: 'high' | 'medium' | 'low';
    goalsCount: number;
    completedGoalsCount: number;
    completionRate: number;
}