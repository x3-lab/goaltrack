import {
    Entity,
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ProgressHistory } from './progress-history.entity';

export enum GoalStatus {
    PENDING = 'pending',
    IN_PROGRESS ='in_progress',
    COMPLETED = 'completed',
    OVERDUE = 'overdue',
}

export enum GoalPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

@Entity('goals')
export class Goal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column('uuid')
    volunteerId: string;

    @Column({ type: 'simple-enum', enum: GoalStatus, default: GoalStatus.PENDING })
    status: GoalStatus;

    @Column({ default: 0 })
    progress: number;

    @Column({ type: 'simple-enum', enum: GoalPriority, default: GoalPriority.MEDIUM })
    priority: GoalPriority;

    @Column()
    category: string;

    @Column({ type: 'date'})
    dueDate: Date;

    @Column('simple-json', { nullable: true })
    tags: string[];

    @Column({ nullable: true })
    notes: string[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.goals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'volunteerId' })
    volunteer: User;

    @OneToMany(() => ProgressHistory, progressHistory => progressHistory.goal, { cascade: true })
    progressHistory: ProgressHistory[];
}