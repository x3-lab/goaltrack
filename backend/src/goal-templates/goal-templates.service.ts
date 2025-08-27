import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, MoreThan } from 'typeorm';
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
            status: createTemplateDto.status || TemplateStatus.ACTIVE,
            startDate: createTemplateDto.startDate ? new Date(createTemplateDto.startDate) : undefined,
            dueDate: createTemplateDto.dueDate ? new Date(createTemplateDto.dueDate) : undefined
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

        const updateData = { ...updateTemplateDto };
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate) as any;
        }
        if (updateData.dueDate) {
            updateData.dueDate = new Date(updateData.dueDate) as any;
        }

        Object.assign(template, updateData);
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
            startDate: new Date().toISOString().split('T')[0],
            status: GoalStatus.PENDING,
            tags: template.tags,
            notes: useTemplateDto.customNotes ? [useTemplateDto.customNotes] : [],
            templateId: template.id
        };

        try {
            const createdGoal = await this.goalsService.create(createGoalDto, currentUser.id);

            // Update template usage count after successful goal creation
            template.usageCount += 1;
            await this.templateRepository.save(template);

            console.log(`Template ${template.id} usage count updated to ${template.usageCount}`);

            return createdGoal;
        } catch (error) {
            console.error('Error creating goal from template:', error);
            throw error;
        }
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

    async getTemplateUsageStats(templateId: string): Promise<{
        totalUsage: number;
        recentUsage: number;
        avgCompletionRate: number;
        goalsCreated: number;
        completedGoals: number;
        activeGoals: number;
        usageByMonth: { month: string; count: number }[];
    }> {
        const template = await this.templateRepository.findOne({
            where: { id: templateId }
        });

        if (!template) {
            throw new NotFoundException('Goal template not found');
        }

        // Get all goals created from this template
        const goalsFromTemplate = await this.goalRepository.find({
            where: { templateId: templateId },
            select: ['id', 'status', 'createdAt']
        });

        const totalUsage = template.usageCount;
        const goalsCreated = goalsFromTemplate.length;

        // Calculate recent usage (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentGoals = goalsFromTemplate.filter(goal => 
            goal.createdAt >= thirtyDaysAgo
        );
        const recentUsage = recentGoals.length;

        // Calculate completion statistics
        const completedGoals = goalsFromTemplate.filter(goal => 
            goal.status === GoalStatus.COMPLETED
        ).length;

        const activeGoals = goalsFromTemplate.filter(goal => 
            goal.status === GoalStatus.IN_PROGRESS || goal.status === GoalStatus.PENDING
        ).length;

        // Calculate average completion rate
        const avgCompletionRate = goalsCreated > 0 
            ? Math.round((completedGoals / goalsCreated) * 100) 
            : 0;

        // Calculate usage by month for the last 12 months
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyUsage = new Map<string, number>();
        
        // Initialize the last 12 months with 0 counts
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
            monthlyUsage.set(monthKey, 0);
        }

        // Count actual usage
        goalsFromTemplate
            .filter(goal => goal.createdAt >= twelveMonthsAgo)
            .forEach(goal => {
                const monthKey = goal.createdAt.toISOString().slice(0, 7);
                if (monthlyUsage.has(monthKey)) {
                    monthlyUsage.set(monthKey, monthlyUsage.get(monthKey)! + 1);
                }
            });

        const usageByMonth = Array.from(monthlyUsage.entries()).map(([month, count]) => ({
            month,
            count
        }));

        return {
            totalUsage,
            recentUsage,
            avgCompletionRate,
            goalsCreated,
            completedGoals,
            activeGoals,
            usageByMonth
        };
    }

    async getTemplateAnalytics(): Promise<{
        totalTemplates: number;
        activeTemplates: number;
        totalUsage: number;
        avgUsagePerTemplate: number;
        topCategories: any[];
        recentlyCreated: GoalTemplateResponseDto[];
        mostUsed: GoalTemplateResponseDto[];
        trendingTemplates: GoalTemplateResponseDto[];
    }> {
        // Get basic template counts
        const [totalTemplates, activeTemplates] = await Promise.all([
            this.templateRepository.count(),
            this.templateRepository.count({ where: { status: TemplateStatus.ACTIVE } })
        ]);

        // Get total usage across all templates
        const usageResult = await this.templateRepository
            .createQueryBuilder('template')
            .select('SUM(template.usageCount)', 'totalUsage')
            .getRawOne();
        
        const totalUsage = parseInt(usageResult?.totalUsage || '0');
        const avgUsagePerTemplate = totalTemplates > 0 ? Math.round(totalUsage / totalTemplates) : 0;

        // Get category statistics
        const categoryStats = await this.getCategoryStats();

        // Get recently created templates (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentlyCreated = await this.templateRepository.find({
            where: { 
                status: TemplateStatus.ACTIVE,
                createdAt: MoreThan(thirtyDaysAgo)
            },
            relations: ['createdBy'],
            order: { createdAt: 'DESC' },
            take: 5
        });

        // Get most used templates
        const mostUsed = await this.templateRepository.find({
            where: { status: TemplateStatus.ACTIVE },
            relations: ['createdBy'],
            order: { usageCount: 'DESC' },
            take: 5
        });

        // Get trending templates (high recent usage)
        const trendingTemplates = await this.templateRepository.find({
            where: { status: TemplateStatus.ACTIVE },
            relations: ['createdBy'],
            order: { usageCount: 'DESC', createdAt: 'DESC' },
            take: 5
        });

        return {
            totalTemplates,
            activeTemplates,
            totalUsage,
            avgUsagePerTemplate,
            topCategories: categoryStats.slice(0, 5), // Top 5 categories
            recentlyCreated: recentlyCreated.map(template => new GoalTemplateResponseDto(template)),
            mostUsed: mostUsed.map(template => new GoalTemplateResponseDto(template)),
            trendingTemplates: trendingTemplates.map(template => new GoalTemplateResponseDto(template))
        };
    }

    async getCategoryStats(): Promise<{
        category: string;
        totalTemplates: number;
        totalUsage: number;
        avgRating: number;
        popularTemplates: GoalTemplateResponseDto[];
    }[]> {
        // Get category statistics with usage counts
        const categoryData = await this.templateRepository
            .createQueryBuilder('template')
            .select([
                'template.category as category',
                'COUNT(template.id) as totalTemplates',
                'SUM(template.usageCount) as totalUsage',
                'AVG(template.usageCount) as avgUsage'
            ])
            .where('template.status = :status', { status: TemplateStatus.ACTIVE })
            .groupBy('template.category')
            .orderBy('totalUsage', 'DESC')
            .getRawMany();

        // For each category, get the most popular templates
        const categoryStats = await Promise.all(
            categoryData.map(async (cat) => {
                const popularTemplates = await this.templateRepository.find({
                    where: { 
                        category: cat.category,
                        status: TemplateStatus.ACTIVE 
                    },
                    relations: ['createdBy'],
                    order: { usageCount: 'DESC' },
                    take: 3
                });

                return {
                    category: cat.category,
                    totalTemplates: parseInt(cat.totalTemplates),
                    totalUsage: parseInt(cat.totalUsage || '0'),
                    avgRating: 4.2, // Placeholder - implement rating system later
                    popularTemplates: popularTemplates.map(template => new GoalTemplateResponseDto(template))
                };
            })
        );

        return categoryStats;
    }

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