import { 
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Patch,
    ValidationPipe,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';


export class changePasswordDto {
    currentPassword: string;
    newPassword: string;
}


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: User): Promise<Omit<User, 'password'>> {
        return user;
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(@CurrentUser() user: User, @Body(ValidationPipe) changePasswordDto: changePasswordDto): Promise<{ message: string }> {
        await this.authService.changePassword(user.id, changePasswordDto.currentPassword, changePasswordDto.newPassword);
        return { message: 'Password changed successfully' };
    }

    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    async refreshToken(@CurrentUser() user: User): Promise<AuthResponseDto> {
        return this.authService.refreshToken(user);
    }

    
}
