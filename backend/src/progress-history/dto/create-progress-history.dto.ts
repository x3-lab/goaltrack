import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsNumber,
    IsUUID,
    Min,
    Max,
    MinLength,
} from 'class-validator';
import { GoalStatus } from 'src/database/enums/goals.enums';


export class CreateProgressHistoryDto {
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters long' })
    title: string;

    @IsUUID(4, { message: 'Goal ID must be a valid UUID' })
    goalId: string;

    @IsUUID(4, { message: 'Volunteer ID must be a valid UUID' })
    volunteerId: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    progress: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsDateString()
    weekStart: string;

    @IsDateString()
    weekEnd: string;

    @IsEnum(GoalStatus)
    status: GoalStatus;
}
