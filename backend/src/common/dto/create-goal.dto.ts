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
} from 'class-validator';
import { GoalStatus, GoalPriority } from 'src/database/entities/goal.entity';


export class CreateGoalDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsEnum(GoalPriority)
    priority: GoalPriority;

    @IsUUID()
    volunteerId: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status: GoalStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    progress: number;

    @IsDateString()
    dueDate: Date;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    notes: string[];

    @IsOptional()
    @IsDateString()
    weekStart: Date;

    @IsOptional()
    @IsDateString()
    weekEnd: Date;
}