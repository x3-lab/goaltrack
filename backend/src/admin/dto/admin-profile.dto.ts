import { IsString, IsEmail, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';


export class AdminProfileDto {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin';
    joinDate: string;
    lastLogin: string;
    profileImage?: string;
    title: string;
    permissions: string[];
    preferences: {
        weeklyReports: boolean;
        systemAlerts: boolean;
        theme: 'light' | 'dark' | 'auto';
        timezone: string;
    };
    stats: {
        totalVolunteersManaged: number;
        totalGoalsOversaw: number;
        lastSystemMaintenance: string;
    };
}


export class UpdateAdminProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    profileImage?: string;
}

export class UpdateAdminPreferencesDto {
    @IsOptional()
    @IsBoolean()
    weeklyReports?: boolean;

    @IsOptional()
    @IsBoolean()
    systemAlerts?: boolean;

    @IsOptional()
    @IsString()
    theme?: 'light' | 'dark' | 'auto';

    @IsOptional()
    @IsString()
    timezone?: string;
}