import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TemplateStatus, TemplatePriority } from '../../database/enums/goal-template.enums';

export class GoalTemplateFiltersDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsEnum(TemplatePriority)
    priority?: TemplatePriority;

    @IsOptional()
    @IsEnum(TemplateStatus)
    status?: TemplateStatus;

    @IsOptional()
    @IsString()
    createdBy?: string;
}