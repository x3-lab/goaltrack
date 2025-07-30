import { Exclude, Expose } from 'class-transformer';
import { GoalStatus, GoalPriority } from '../../database/enums/goals.enums';


export class GoalResponseDto {
    id: string;
    title: string;
    description?: string;
    volunteerId: string;
    status: GoalStatus;
    priority: GoalPriority;
    progress: number;
    category: string;
    dueDate: Date;
    tags?: string[];
    notes?: string[];
    createdAt: Date;
    updatedAt: Date;

        @Expose()
        get isOverdue(): boolean {
            return this.status === GoalStatus.OVERDUE ||
            (this.status !== GoalStatus.COMPLETED && new Date() > this.dueDate);
        }

        @Expose()
        get daysUntilDue(): number {
            const today = new Date();
            const dueDate = new Date(this.dueDate);
            const diffTime = dueDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        constructor(partial: Partial<GoalResponseDto>) {
            Object.assign(this, partial);
        }
    }