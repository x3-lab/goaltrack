import { IsString, MinLength } from 'class-validator';


export class ChangeAdminPasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}