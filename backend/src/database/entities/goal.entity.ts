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
import { GoalTemplate } from './goal-template.entity';
import { GoalStatus, GoalPriority } from '../enums/goals.enums';


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

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date'})
    dueDate: Date;

    @Column('simple-json', { nullable: true })
    tags: string[];

    @Column( 'simple-array', {nullable: true })
    notes: string[];

    @Column('uuid', { nullable: true })
    templateId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.goals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'volunteerId' })
    volunteer: User;

    @OneToMany(() => ProgressHistory, progressHistory => progressHistory.goal, { cascade: true })
    progressHistory: ProgressHistory[];

    @ManyToOne(() => GoalTemplate, { nullable: true })
    @JoinColumn({ name: 'templateId' })
    template: GoalTemplate;
}