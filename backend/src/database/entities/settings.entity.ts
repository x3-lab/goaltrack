import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { SettingScope, SettingType } from '../enums/settings.enums';


@Entity('settings')
@Index(['scope', 'key'], { unique: true, where: 'user_id IS NULL' })
@Index(['scope', 'key', 'userId'], { unique: true, where: 'user_id IS NOT NULL' })
export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    @Index()
    key: string;

    @Column('text')
    value: string;

    @Column({
        enum: SettingType,
        default: SettingType.STRING
    })
    type: SettingType;

    @Column({
        enum: SettingScope,
        default: SettingScope.SYSTEM
    })
    scope: SettingScope;

    @Column('text', { nullable: true })
    description: string;

    @Column({ default: true })
    editable: boolean;

    @Column({ default: false })
    sensitive: boolean;

    @Column('simple-array', { nullable: true })
    allowedValues: string[];

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'updated_by_id', nullable: true })
    updatedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by_id' })
    updatedBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}