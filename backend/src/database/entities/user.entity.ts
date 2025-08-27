import {
    Entity,
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Goal } from './goal.entity';
import { ProgressHistory } from './progress-history.entity';
import { ActivityLog } from './activity-log.entity';
import { UserRole, UserStatus, Performance } from '../enums/user.enums';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'varchar', length: 15, unique: true })
    phoneNumber: string;

    @Column({ type: 'varchar', nullable: true })
    address: string;

    @Column({ enum: UserRole, default: UserRole.VOLUNTEER })
    role: UserRole;

    @Column({ enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @Column({ enum: Performance, default: Performance.AVERAGE })
    performance: Performance;

    @Column({ type: 'varchar', nullable: true })
    position: string;

    @Column({ type: 'simple-array', nullable: true })
    skills: string[];

    @Column({ default: 0 })
    goalsCount: number;

    @Column({ default: 0 })
    completionRate: number;

    @Column()
    joinedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    lastLogin: Date;

    @Column('json', { nullable: true })
    preferences?: {
        weeklyReports?: boolean;
        systemAlerts?: boolean;
        theme?: 'light' | 'dark' | 'auto';
        timezone?: string;
    };

    @Column({ nullable: true })
    profileImage?: string;

    @Column({ type: 'datetime', nullable: true })
    lastLoginAt?: Date;

    // Relationships
    @OneToMany(() => Goal, (goal) => goal.volunteer)
    goals: Goal[];

    @OneToMany(() => ProgressHistory, (progressHistory) => progressHistory.volunteer)
    progressHistory: ProgressHistory[];

    @OneToMany(() => ActivityLog, (activityLog) => activityLog.user)
    activityLogs: ActivityLog[];
}