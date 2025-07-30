import{
    IsEmail,
    IsString,
    IsOptional,
    IsEnum,
    MinLength,
    IsArray,
    IsPhoneNumber,
} from 'class-validator';
import { UserStatus, UserRole, Performance } from '../../database/enums/user.enums';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsEnum(UserStatus)
    status: UserStatus;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    notes?: string;
};