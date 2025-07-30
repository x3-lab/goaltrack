import { IsEnum } from "class-validator";
import { GoalStatus } from "src/database/enums/goals.enums";


export class UpdateGoalStatusDto {
    @IsEnum(GoalStatus)
    status: GoalStatus;
}
