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
import { Goal, GoalStatus } from './goal.entity';


@Entity('progress_history')
export class ProgressHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    goalId: string;

    @Column('uuid')
    volunteerId: string;

    @Column()
    progress: number;

    @Column({ nullable: true})
    notes: string;

    @Column({ type: 'timestamp' })
    weekStart: Date

    @Column({ type: 'timestamp' })
    weekEnd: Date;

    @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.IN_PROGRESS })
    status: GoalStatus;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Goal, (goal) => goal.progressHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'goalId' })
    goal: Goal;

    @ManyToOne(() => User, (user) => user.progressHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'volunteerId' })
    volunteer: User;
}