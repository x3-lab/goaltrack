import { IsEnum } from "class-validator";
import { GoalStatus } from "../../database/enums/goals.enums";


export class UpdateGoalStatusDto {
    @IsEnum(GoalStatus)
    status: GoalStatus;
}
