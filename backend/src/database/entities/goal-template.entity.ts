import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TemplatePriority, TemplateStatus } from '../enums/goal-template.enums';


@Entity('goal_templates')
export class GoalTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text')
    description: string;

    @Column({ length: 100 })
    category: string;

    @Column({
        type: 'enum',
        enum: TemplatePriority,
        default: TemplatePriority.MEDIUM
    })
    priority: TemplatePriority;

    @Column({ name: 'default_duration', default: 7 })
    defaultDuration: number; // in days

    @Column('simple-array', { nullable: true })
    tags: string[];

    @Column({
        type: 'enum',
        enum: TemplateStatus,
        default: TemplateStatus.ACTIVE
    })
    status: TemplateStatus;

    @Column({ name: 'usage_count', default: 0 })
    usageCount: number;

    @Column({ name: 'created_by_id' })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column('text', { nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}