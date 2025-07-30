import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Goal } from './goal.entity';
import { GoalStatus } from '../enums/goals.enums';


@Entity('progress_history')
export class ProgressHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    title: string;

    @Column('uuid')
    goalId: string;

    @Column('uuid')
    volunteerId: string;

    @Column()
    progress: number;

    @Column({ nullable: true})
    notes: string;

    @Column()
    weekStart: Date

    @Column()
    weekEnd: Date;

    @Column({ enum: GoalStatus, default: GoalStatus.IN_PROGRESS })
    status: GoalStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Goal, (goal) => goal.progressHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'goalId' })
    goal: Goal;

    @ManyToOne(() => User, (user) => user.progressHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'volunteerId' })
    volunteer: User;
}