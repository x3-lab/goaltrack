import { IsArray, IsUUID, IsEnum, IsOptional } from "class-validator";
import { GoalStatus, GoalPriority } from "../../database/enums/goals.enums";


export class BulkUpdateGoalsDto {
    @IsArray()
    @IsUUID('4', { each: true, message: 'Each goal ID must be a valid UUID' })
    goalIds: string[];

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsEnum(GoalPriority)
    priority?: GoalPriority;
}