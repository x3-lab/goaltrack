import { Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
    ForbiddenException
 } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { UpdateUserStatusDto } from './dto/user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserAnalyticsDto } from './dto/user-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../database/enums/user.enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(@Query(ValidationPipe) filters: UserFiltersDto): Promise<{
        users: UserResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return this.usersService.findAll(filters);
    }

    @Get('me')
    async getMyProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
        return this.usersService.findOne(user.id);
    }

    @Get('export')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async exportUsers(@Query(ValidationPipe) filters: UserFiltersDto): Promise<UserResponseDto[]> {
        return this.usersService.exportUsers(filters);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User): Promise<UserResponseDto> {
            if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
                throw new ForbiddenException('You do not have permission to access this user profile.');
            }
        return this.usersService.findOne(id);
    }

    @Get(':id/analytics')
    async getUserAnalytics(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User
    ): Promise<UserAnalyticsDto> {
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
            throw new ForbiddenException('You do not have permission to access this user analytics.');
        }
        return this.usersService.getUserAnalytics(id);
    }

    @Get(':id/performance')
    async getUserPerformance(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User
    ): Promise<{
        totalGoals: number;
        completedGoals: number;
        completionRate: number;
        averageProgress: number;
    }> {
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
            throw new ForbiddenException('You do not have permission to access this user performance.');
        }
        return this.usersService.getPerformanceMetrics(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateUserStatusDto: UpdateUserStatusDto,
    ): Promise<UserResponseDto> {
        return this.usersService.updateStatus(id, updateUserStatusDto);
    }

    @Post('bulk/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async bulkUpdateStatus(
        @Body(ValidationPipe) bulkUpdatDto: {
            userIds: string[];
            status: UserStatus;
        },
    ): Promise<{ message: string}> {
        await this.usersService.bulkUpdateStatus(bulkUpdatDto.userIds, bulkUpdatDto.status);
        return { message: `Successfully updated ${bulkUpdatDto.userIds.length} users` }
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void>
    {
        await this.usersService.remove(id);
    }

}