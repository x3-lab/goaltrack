import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class UseTemplateDto {
    @IsUUID()
    templateId: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    dueDate: string;

    @IsOptional()
    @IsUUID()
    volunteerId?: string; // For admin creating goals for volunteers

    @IsOptional()
    @IsString()
    customNotes?: string;
}