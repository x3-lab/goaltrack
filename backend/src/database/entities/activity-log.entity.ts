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


@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @Column({ type: 'text' })
    action: string;

    @Column()
    resource: string

    @Column('uuid')
    resourceId: string;

    @Column('simple-json', { nullable: true })
    details: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    // Relationships
    @ManyToOne(() => User, (user) => user.activityLogs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}