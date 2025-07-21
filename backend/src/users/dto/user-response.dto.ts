import { Exclude } from 'class-transformer';
import { UserRole, UserStatus, Performance } from '../../database/enums/user.enums';


export class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    role: UserRole;
    position?: string;
    status: UserStatus;
    skills?: string[];
    notes?: string;
    performance?: Performance;
    goalsCount?: number;
    completionRate?: number;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;

    @Exclude()
    password: string;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }
}