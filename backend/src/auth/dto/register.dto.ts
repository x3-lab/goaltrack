import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray } from "class-validator";
import { UserRole } from "../../database/enums/user.enums";


export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsString({ message: 'First name must be a string' })
    firstName: string;

    @IsString({ message: 'Last name must be a string' })
    lastName: string;

    @IsOptional()
    @IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
    role?: UserRole;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];
}