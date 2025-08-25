import { IsString, IsEnum, IsOptional, IsNumber, IsArray, Min, Max, MaxLength, IsDateString } from 'class-validator';
import { TemplatePriority, TemplateStatus } from '../../database/enums/goal-template.enums';


export class CreateGoalTemplateDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    description: string;

    @IsString()
    @MaxLength(100)
    category: string;

    @IsEnum(TemplatePriority)
    priority: TemplatePriority;

    @IsNumber()
    @Min(1)
    @Max(365)
    defaultDuration: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsEnum(TemplateStatus)
    status?: TemplateStatus;

    @IsOptional()
    @IsString()
    notes?: string;
}