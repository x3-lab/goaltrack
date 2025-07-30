import { Setting } from '../../database/entities/settings.entity';


export class SettingResponseDto {
    id: string;
    key: string;
    value: any;
    rawValue: string;
    type: string;
    scope: string;
    description?: string;
    editable: boolean;
    sensitive: boolean;
    allowedValues?: string[];
    userId?: string;
    updatedById?: string;
    updatedByName?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(setting: Setting) {
        this.id = setting.id;
        this.key = setting.key;
        this.rawValue = setting.value;
        this.value = this.parseValue(setting.value, setting.type);
        this.type = setting.type;
        this.scope = setting.scope;
        this.description = setting.description;
        this.editable = setting.editable;
        this.sensitive = setting.sensitive;
        this.allowedValues = setting.allowedValues;
        this.userId = setting.userId;
        this.updatedById = setting.updatedById;
        this.updatedByName = setting.updatedBy?.firstName;
        this.createdAt = setting.createdAt;
        this.updatedAt = setting.updatedAt;
    }

    private parseValue(value: string, type: string): any {
        if (this.sensitive) {
            return '***';
        }

        try {
            switch (type) {
                case 'boolean':
                    return value === 'true';
                case 'number':
                    return Number(value);
                case 'json':
                    return JSON.parse(value);
                case 'array':
                    return JSON.parse(value);
                default:
                    return value;
            }
        } catch {
            return value;
        }
    }
}