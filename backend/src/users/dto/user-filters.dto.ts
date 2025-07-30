import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole, UserStatus, Performance } from '../../database/enums/user.enums';


export class UserFiltersDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    @IsEnum(Performance)
    performance?: Performance;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })

    @IsBoolean()
    hasGoals?: boolean;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}