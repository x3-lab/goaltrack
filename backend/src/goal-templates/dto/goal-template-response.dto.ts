import { GoalTemplate } from '../../database/entities/goal-template.entity';

export class GoalTemplateResponseDto {
    id: string;
    name: string;
    description: string;
    category: string;
    priority: string;
    defaultDuration: number;
    tags: string[];
    status: string;
    usageCount: number;
    createdById: string;
    createdByName: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(template: GoalTemplate) {
        this.id = template.id;
        this.name = template.name;
        this.description = template.description;
        this.category = template.category;
        this.priority = template.priority;
        this.defaultDuration = template.defaultDuration;
        this.tags = template.tags || [];
        this.status = template.status;
        this.usageCount = template.usageCount;
        this.createdById = template.createdById;
        this.createdByName = template.createdBy?.firstName || 'Unknown';
        this.notes = template.notes;
        this.createdAt = template.createdAt;
        this.updatedAt = template.updatedAt;
    }
}