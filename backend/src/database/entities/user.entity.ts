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

export enum UserRole {
    ADMIN = 'admin',
    VOLUNTEER = 'volunteer',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum Performance {
    HIGH = 'high',
    AVERAGE = 'average',
    LOW = 'low',
}

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

    @Column({ type: 'varchar' })
    address: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.VOLUNTEER })
    role: UserRole;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @Column({ type: 'enum', enum: Performance, default: Performance.AVERAGE })
    performance: Performance;

    @Column({ type: 'varchar', nullable: true })
    position: string;

    @Column({ type: 'simple-array', nullable: true })
    skills: string[];

    @Column({ default: 0 })
    goalsCount: number;

    @Column({ default: 0 })
    completionRate: number;

    @Column({ type: 'timestamp'})
    joinedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastLogin: Date;

    // Relationships
    @OneToMany(() => Goal, (goal) => goal.volunteer)
    goals: Goal[];

    @OneToMany(() => ProgressHistory, (progressHistory) => progressHistory.volunteer)
    progressHistory: ProgressHistory[];

    @OneToMany(() => ActivityLog, (activityLog) => activityLog.user)
    activityLogs: ActivityLog[];
}