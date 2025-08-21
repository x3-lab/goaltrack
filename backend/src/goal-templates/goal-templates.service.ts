import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GoalTemplate } from '../database/entities/goal-template.entity';
import { TemplateStatus } from '../database/enums/goal-template.enums';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user.enums';
import { Goal } from '../database/entities/goal.entity';
import { GoalStatus } from '../database/enums/goals.enums';
import { CreateGoalTemplateDto } from './dto/create-goal-template.dto';
import { UpdateGoalTemplateDto } from './dto/update-goal-template.dto';
import { GoalTemplateResponseDto } from './dto/goal-template-response.dto';
import { GoalTemplateFiltersDto } from './dto/goal-template-filters.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { GoalsService } from '../goals/goals.service';
import { CreateGoalDto } from '../goals/dto/create-goal.dto';

@Injectable()
export class GoalTemplatesService {
    constructor(
        @InjectRepository(GoalTemplate)
        private readonly templateRepository: Repository<GoalTemplate>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Goal)
        private readonly goalRepository: Repository<Goal>,
        private readonly goalsService: GoalsService
    ) {}

    async create(
        createTemplateDto: CreateGoalTemplateDto,
        currentUser: User
    ): Promise<GoalTemplateResponseDto> {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can create goal templates');
        }

        const existingTemplate = await this.templateRepository.findOne({
            where: { name: createTemplateDto.name, status: TemplateStatus.ACTIVE }
        });

        if (existingTemplate) {
            throw new BadRequestException('A template with this name already exists');
        }

        const template = this.templateRepository.create({
            ...createTemplateDto,
            createdById: currentUser.id,
            status: createTemplateDto.status || TemplateStatus.ACTIVE
        });

        const savedTemplate = await this.templateRepository.save(template);
        
        const templateWithRelations = await this.templateRepository.findOne({
            where: { id: savedTemplate.id },
            relations: ['createdBy']
        });

        if (!templateWithRelations) {
            throw new NotFoundException('Created template not found');
        }

        return new GoalTemplateResponseDto(templateWithRelations);
    }

    async findAll(
        filters: GoalTemplateFiltersDto,
        currentUser: User,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        templates: GoalTemplateResponseDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const queryBuilder = this.templateRepository
            .createQueryBuilder('template')
            .leftJoinAndSelect('template.createdBy', 'createdBy')
            .orderBy('template.createdAt', 'DESC');

        await this.applyFilters(queryBuilder, filters, currentUser);

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [templates, total] = await queryBuilder.getManyAndCount();

        return {
            templates: templates.map(template => new GoalTemplateResponseDto(template)),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: string, currentUser: User): Promise<GoalTemplateResponseDto> {
        const template = await this.templateRepository.findOne({
            where: { id },
            relations: ['createdBy']
        });

        if (!template) {
            throw new NotFoundException('Goal template not found');
        }

        return new GoalTemplateResponseDto(template);
    }

    async update(
        id: string,
        updateTemplateDto: UpdateGoalTemplateDto,
        currentUser: User
    ): Promise<GoalTemplateResponseDto> {
        const template = await this.templateRepository.findOne({
            where: { id },
            relations: ['createdBy']
        });

        if (!template) {
            throw new NotFoundException('Goal template not found');
        }

        if (currentUser.role !== UserRole.ADMIN && template.createdById !== currentUser.id) {
            throw new ForbiddenException('You can only update templates you created');
        }

        if (updateTemplateDto.name && updateTemplateDto.name !== template.name) {
            const existingTemplate = await this.templateRepository.findOne({
                where: { name: updateTemplateDto.name, status: TemplateStatus.ACTIVE }
            });

            if (existingTemplate && existingTemplate.id !== id) {
                throw new BadRequestException('A template with this name already exists');
            }
        }

        Object.assign(template, updateTemplateDto);
        const updatedTemplate = await this.templateRepository.save(template);

        return new GoalTemplateResponseDto(updatedTemplate);
    }

    async remove(id: string, currentUser: User): Promise<void> {
        const template = await this.templateRepository.findOne({
            where: { id }
        });

        if (!template) {
            throw new NotFoundException('Goal template not found');
        }

        if (currentUser.role !== UserRole.ADMIN && template.createdById !== currentUser.id) {
            throw new ForbiddenException('You can only delete templates you created');
        }

        template.status = TemplateStatus.ARCHIVED;
        await this.templateRepository.save(template);
    }

    async duplicate(id: string, currentUser: User): Promise<GoalTemplateResponseDto> {
        const originalTemplate = await this.templateRepository.findOne({
            where: { id },
            relations: ['createdBy']
        });

        if (!originalTemplate) {
            throw new NotFoundException('Goal template not found');
        }

        if (currentUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can duplicate templates');
        }

        const duplicatedTemplate = this.templateRepository.create({
            name: `${originalTemplate.name} (Copy)`,
            description: originalTemplate.description,
            category: originalTemplate.category,
            priority: originalTemplate.priority,
            defaultDuration: originalTemplate.defaultDuration,
            tags: originalTemplate.tags,
            status: TemplateStatus.ACTIVE,
            createdById: currentUser.id,
            notes: originalTemplate.notes
        });

        const savedTemplate = await this.templateRepository.save(duplicatedTemplate);
        
        const templateWithRelations = await this.templateRepository.findOne({
            where: { id: savedTemplate.id },
            relations: ['createdBy']
        });

        if (!templateWithRelations) {
            throw new NotFoundException('Duplicated template not found');
        }

        return new GoalTemplateResponseDto(templateWithRelations);
    }

    async useTemplate(
        useTemplateDto: UseTemplateDto,
        currentUser: User
    ): Promise<any> {
        const template = await this.templateRepository.findOne({
            where: { id: useTemplateDto.templateId, status: TemplateStatus.ACTIVE }
        });

        if (!template) {
            throw new NotFoundException('Goal template not found or inactive');
        }

        let targetVolunteerId = currentUser.id;
        if (useTemplateDto.volunteerId) {
            if (currentUser.role !== UserRole.ADMIN) {
                throw new ForbiddenException('Only administrators can create goals for other volunteers');
            }
            targetVolunteerId = useTemplateDto.volunteerId;
        }

        const volunteer = await this.userRepository.findOne({
            where: { id: targetVolunteerId }
        });

        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        const createGoalDto: CreateGoalDto = {
            title: useTemplateDto.title,
            description: useTemplateDto.description || template.description,
            category: template.category,
            priority: template.priority as any,
            volunteerId: targetVolunteerId,
            dueDate: useTemplateDto.dueDate,
            startDate: new Date().toISOString(),
            status: GoalStatus.PENDING,
            tags: template.tags,
            notes: useTemplateDto.customNotes ? [useTemplateDto.customNotes] : []
        };

        const createdGoal = await this.goalsService.create(createGoalDto, currentUser.id);

        template.usageCount += 1;
        await this.templateRepository.save(template);

        return createdGoal;
    }

    async getCategories(): Promise<string[]> {
        const result = await this.templateRepository
            .createQueryBuilder('template')
            .select('DISTINCT template.category', 'category')
            .where('template.status = :status', { status: TemplateStatus.ACTIVE })
            .getRawMany();

        return result.map(item => item.category).filter(Boolean).sort();
    }

    async getPopularTemplates(limit: number = 10): Promise<GoalTemplateResponseDto[]> {
        const templates = await this.templateRepository.find({
            where: { status: TemplateStatus.ACTIVE },
            relations: ['createdBy'],
            order: { usageCount: 'DESC', createdAt: 'DESC' },
            take: limit
        });

        return templates.map(template => new GoalTemplateResponseDto(template));
    }

    // async getTemplateUsageStats(templateId: string): Promise<{
    //     totalUsage: number;
    //     recentUsage: number;
    //     avgCompletionRate: number;
    // }> {
    //     const template = await this.templateRepository.findOne({
    //         where: { id: templateId }
    //     });

    //     if (!template) {
    //         throw new NotFoundException('Goal template not found');
    //     }

    //     const totalUsage = template.usageCount;

    //     const thirtyDaysAgo = new Date();
    //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


    //    TODO: I should add a field to the Goal entity to track which template (if any) it was created from.
    //    Then, I can correctly calculate the recent usage and average from throwDeprecation.
    //     
    //      const recentUsage = Math.floor(totalUsage * 0.3);

    //  
    //     const avgCompletionRate = 75;

    //     return {
    //         totalUsage,
    //         recentUsage,
    //         avgCompletionRate
    //     };
    // }

    private async applyFilters(
        queryBuilder: SelectQueryBuilder<GoalTemplate>,
        filters: GoalTemplateFiltersDto,
        currentUser: User
    ): Promise<void> {
        if (currentUser.role !== UserRole.ADMIN) {
            queryBuilder.andWhere('template.status = :status', { status: TemplateStatus.ACTIVE });
        }

        if (filters.search) {
            queryBuilder.andWhere(
                '(template.name ILIKE :search OR template.description ILIKE :search OR template.category ILIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        if (filters.category) {
            queryBuilder.andWhere('template.category = :category', { category: filters.category });
        }

        if (filters.priority) {
            queryBuilder.andWhere('template.priority = :priority', { priority: filters.priority });
        }

        if (filters.status && currentUser.role === UserRole.ADMIN) {
            queryBuilder.andWhere('template.status = :status', { status: filters.status });
        }

        if (filters.createdBy && currentUser.role === UserRole.ADMIN) {
            queryBuilder.andWhere('template.createdById = :createdBy', { createdBy: filters.createdBy });
        }
    }
}