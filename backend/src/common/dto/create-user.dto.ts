import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { UserRole, UserStatus } from 'src/database/enums/user.enums';

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsEnum(UserRole)
    role: UserRole = UserRole.VOLUNTEER;

    @IsOptional()
    @IsEnum(UserStatus)
    status: UserStatus;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    skills?: string[];

    @IsDateString()
    joinedAt: Date = new Date();

    @IsOptional()
    lastLogin?: Date;

    @IsOptional()
    notes?: string[];
}