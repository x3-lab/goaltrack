import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsNumber,
    IsArray,
    IsUUID,
    Min,
    Max,
    MinLength,
} from 'class-validator';
import { GoalStatus, GoalPriority } from 'src/database/enums/goals.enums';


export class CreateGoalDto {
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters long' })
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsUUID('4', { message: 'Owner ID must be a valid UUID' })
    volunteerId: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status: GoalStatus;

    @IsOptional()
    @IsEnum(GoalPriority)
    priority: GoalPriority;

    @IsString()
    category: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    dueDate: Date;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    progress?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    notes?: string[];
}