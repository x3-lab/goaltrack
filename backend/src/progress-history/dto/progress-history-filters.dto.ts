import { IsOptional, IsEnum, IsString, IsDateString, IsUUID } from "class-validator";
import { Transform } from 'class-transformer';
import { GoalStatus } from "src/database/enums/goals.enums";
import { parse } from "path";


export class ProgressHistoryFiltersDto {
    @IsOptional()
    @IsUUID()
    volunteerId?: string;

    @IsOptional()
    @IsUUID()
    goalId?: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsDateString()
    weekStartFrom?: string;

    @IsOptional()
    @IsDateString()
    weekStartTo?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    minProgress?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxProgress?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    page?: number;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}
