import { IsNumber, Min, Max, IsOptional, IsString } from "class-validator";


export class UpdateGoalProgressDto {
    @IsNumber()
    @Min(0)
    @Max(100)
    progress: number;

    @IsOptional()
    @IsString()
    notes?: string;
}