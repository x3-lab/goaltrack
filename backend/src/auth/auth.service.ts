import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const existsingUser = await this.userRepository.findOne({ where: { email: registerDto.email } });
        if (existsingUser) {
            throw new ConflictException('User with this email already exists');
        }
        const existingPhoneUser = await this.userRepository.findOne({ where: { phoneNumber: registerDto.phoneNumber } });
        if (existingPhoneUser) {
            throw new ConflictException('User with this phone number already exists');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 12);

        const user = this.userRepository.create({
            ...registerDto,
            password: hashedPassword,
            joinedAt: new Date(),
            status: UserStatus.ACTIVE,
        })

        const savedUser = await this.userRepository.save(user);


        const payload: JwtPayload = {
            sub: savedUser.id,
            email: savedUser.email,
            role: savedUser.role,
            iat: Math.floor(Date.now() / 1000),
        };

        const access_token = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = savedUser;

        return {
            access_token,
            user: userWithoutPassword,
        };
    }

    async login(LoginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(LoginDto.email, LoginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.userRepository.update(user.id, { lastLogin: new Date() });

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
        };

        const access_token = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;

        return {
            access_token,
            user: userWithoutPassword,
        };
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async validateUserById(id: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user || user.status !== UserStatus.ACTIVE) {
            return null;
        }
        return user;
    }

    async refreshToken(user: User): Promise<AuthResponseDto> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
        };

        const access_toekn = this.jwtService.sign(payload)

        const { password, ...userWithoutPassword } = user;

        return {
            access_token: access_toekn,
            user: userWithoutPassword,
        };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        
        await this.userRepository.update(userId, { password: hashedNewPassword });

        return true;
    }
};

