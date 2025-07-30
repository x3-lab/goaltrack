import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserStatus,Performance } from 'src/database/enums/user.enums';


export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    @IsEnum(Performance)
    performance?: Performance;

    @IsOptional()
    goalsCount?: number;

    @IsOptional()
    completionRate?: number;
}