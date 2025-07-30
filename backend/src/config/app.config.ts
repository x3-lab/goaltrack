import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    jwtSecret: process.env.JWT_SECRET || 'defaultSecretKey',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    environment: process.env.NODE_ENV || 'development',
}));
