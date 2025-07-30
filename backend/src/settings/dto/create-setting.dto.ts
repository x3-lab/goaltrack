import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';
import { SettingScope, SettingType } from '../../database/enums/settings.enums';


export class CreateSettingDto {
    @IsString()
    @MaxLength(100)
    key: string;

    @IsString()
    value: string;

    @IsEnum(SettingType)
    type: SettingType;

    @IsEnum(SettingScope)
    scope: SettingScope;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    editable?: boolean;

    @IsOptional()
    @IsBoolean()
    sensitive?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allowedValues?: string[];

    @IsOptional()
    @IsString()
    userId?: string;
}