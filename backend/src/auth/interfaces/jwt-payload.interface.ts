import { UserRole } from '../../database/enums/user.enums';


export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
}