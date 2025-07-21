import { User, UserRole } from '../../database/entities/user.entity';


export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
}