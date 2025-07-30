import { Expose } from 'class-transformer';
import { GoalStatus } from 'src/database/enums/goals.enums';


export class ProgressHistoryResponseDto {
    id: string;
    title: string;
    goalId:string;
    volunteerId: string;
    progress: number;
    notes?: string;
    weekStart: Date;
    weekEnd: Date;
    status: GoalStatus;
    createdAt: Date;
    updatedAt: Date;

    goalTitle?: string;
    volunteerName?: string;
    category: string;

    @Expose()
    get weekRange(): string{
        return `${this.weekStart.toLocaleString()} - ${this.weekEnd.toLocaleString()}`;
    }

    @Expose()
    get progressPercentage(): string {
        return `${this.progress}%`;
    }

    @Expose()
    get isCompleted(): boolean {
        return this.status === GoalStatus.COMPLETED;
    }

    constructor(partial: Partial<ProgressHistoryResponseDto>) {
        Object.assign(this,partial);
    }
}