export class ActivityDto {
    id: string;
    user: string;
    action: string;
    goal: string;
    time: string;
    timestamp: string;
}

export class DeadlineDto {
    id: string;
    volunteer: string;
    volunteerEmail: string;
    goal: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in-progress' | 'completed';
}