import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SettingUpdateItem {
    @IsString()
    key: string;

    @IsString()
    value: string;
}

export class BulkUpdateSettingsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SettingUpdateItem)
    settings: SettingUpdateItem[];
}