import { PartialType } from "@nestjs/mapped-types";
import { IsOptional, IsEnum, IsNumber, Min, Max } from "class-validator";
import { CreateGoalDto } from "./create-goal.dto";
import { GoalStatus, GoalPriority } from "src/database/enums/goals.enums";


export class UpdateGoalDto extends PartialType(CreateGoalDto) {
    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsEnum(GoalPriority)
    priority?: GoalPriority;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    progress?: number;
}