import { User} from '../../database/entities/user.entity';


export class AuthResponseDto {
    access_token: string;
    user: Omit<User, 'password'>;
}