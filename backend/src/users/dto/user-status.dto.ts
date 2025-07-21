import { IsEnum } from 'class-validator';
import { UserStatus } from '../../database/enums/user.enums';


export class UpdateUserStatusDto {
    @IsEnum(UserStatus)
    status: UserStatus;
}