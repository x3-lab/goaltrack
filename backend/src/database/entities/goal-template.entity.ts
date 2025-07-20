import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { GoalPriority } from './goal.entity';


@Entity('goal_templates')
export class GoalTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    category: string;

    @Column({ type: 'simple-enum', enum: GoalPriority, default: GoalPriority.MEDIUM })
    priority: GoalPriority;

    @Column()
    defaultDuration: number; // in days

    @Column({ default: 0 })
    usageCount: number;

    @Column('simple-json', { nullable: true })
    tags: string[];

    @Column({ default: true})
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}