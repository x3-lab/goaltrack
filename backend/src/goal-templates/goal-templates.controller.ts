import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ValidationPipe,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { GoalTemplatesService } from './goal-templates.service';
import { CreateGoalTemplateDto } from './dto/create-goal-template.dto';
import { UpdateGoalTemplateDto } from './dto/update-goal-template.dto';
import { GoalTemplateFiltersDto } from './dto/goal-template-filters.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user.enums';


@Controller('goal-templates')
@UseGuards(JwtAuthGuard)
export class GoalTemplatesController {
    constructor(private readonly goalTemplatesService: GoalTemplatesService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(
        @Body(ValidationPipe) createGoalTemplateDto: CreateGoalTemplateDto,
        @CurrentUser() currentUser: User
    ) {
        return this.goalTemplatesService.create(createGoalTemplateDto, currentUser);
    }

    @Get()
    async findAll(
        @Query() query: any,
        @CurrentUser() currentUser: User
    ) {
        // Extract pagination parameters
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        
        // Extract and validate filter parameters
        const filters = new GoalTemplateFiltersDto();
        if (query.search) filters.search = query.search;
        if (query.category) filters.category = query.category;
        if (query.priority) filters.priority = query.priority;
        if (query.status) filters.status = query.status;
        if (query.createdBy) filters.createdBy = query.createdBy;
        
        return this.goalTemplatesService.findAll(filters, currentUser, page, limit);
    }

    @Get('categories')
    async getCategories() {
        return { categories: await this.goalTemplatesService.getCategories() };
    }

    @Get('popular')
    async getPopularTemplates(@Query('limit') limit: string = '10') {
        const limitNum = parseInt(limit, 10) || 10;
        return this.goalTemplatesService.getPopularTemplates(limitNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.goalTemplatesService.findOne(id, currentUser);
    }

    // @Get(':id/usage-stats')
    // @UseGuards(RolesGuard)
    // @Roles(UserRole.ADMIN)
    // async getUsageStats(@Param('id', ParseUUIDPipe) id: string) {
    //     return this.goalTemplatesService.getTemplateUsageStats(id);
    // }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateGoalTemplateDto: UpdateGoalTemplateDto,
        @CurrentUser() currentUser: User
    ) {
        return this.goalTemplatesService.update(id, updateGoalTemplateDto, currentUser);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User
    ) {
        await this.goalTemplatesService.remove(id, currentUser);
    }

    @Post(':id/duplicate')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async duplicate(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.goalTemplatesService.duplicate(id, currentUser);
    }

    @Post(':id/use')
    async useTemplate(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) useTemplateDto: UseTemplateDto,
        @CurrentUser() currentUser: User
    ) {
        useTemplateDto.templateId = id;
        return this.goalTemplatesService.useTemplate(useTemplateDto, currentUser);
    }
}