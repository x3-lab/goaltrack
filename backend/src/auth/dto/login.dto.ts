import { IsEmail, IsString, MinLength } from "class-validator";


export class LoginDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
    
    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}