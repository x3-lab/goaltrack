import { IsOptional, IsEnum, IsString, IsDateString,IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import { GoalStatus, GoalPriority } from "src/database/enums/goals.enums";


export class GoalFilterDto {
    @IsOptional()
    @IsUUID()
    volunteerId?: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsEnum(GoalPriority)
    priority?: GoalPriority;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDateString()
    dueDateFrom?: Date;

    @IsOptional()
    @IsDateString()
    dueDateTo?: Date;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'dueDate';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'ASC';
}