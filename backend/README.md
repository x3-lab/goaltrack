# GoalTrack Backend Documentation

## Overview
The GoalTrack backend is a robust NestJS application that powers a volunteer management and goal tracking system. It provides RESTful APIs for user management, goal setting, progress tracking, and analytics.

## Technology Stack
- **Framework**: NestJS (v11.0.1)
- **Language**: TypeScript
- **Database**: SQLite with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Security**: bcrypt/bcryptjs for password hashing
- **Scheduling**: @nestjs/schedule for automated tasks

## Project Structure

```
backend/
├── src/
│   ├── admin/                    # Admin-specific functionality
│   │   ├── admin.controller.ts   # Admin dashboard endpoints
│   │   ├── admin.service.ts      # Admin business logic
│   │   └── dto/                  # Admin data transfer objects
│   ├── analytics/                # Analytics and reporting
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   └── dto/
│   ├── auth/                     # Authentication & authorization
│   │   ├── auth.controller.ts    # Login, register, logout endpoints
│   │   ├── auth.service.ts       # JWT token management
│   │   ├── dto/                  # Auth DTOs (login, register)
│   │   ├── guards/               # Route protection guards
│   │   ├── interfaces/           # Auth interfaces
│   │   └── strategies/           # Passport strategies (JWT, Local)
│   ├── common/                   # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── dto/                  # Common DTOs
│   │   ├── guards/               # Shared guards
│   │   └── interceptors/         # Response interceptors
│   ├── config/                   # Configuration management
│   │   ├── app.config.ts         # Application configuration
│   │   └── database.config.ts    # Database configuration
│   ├── database/                 # Database layer
│   │   ├── entities/             # TypeORM entities
│   │   │   ├── activity-log.entity.ts
│   │   │   ├── goal-template.entity.ts
│   │   │   ├── goal.entity.ts
│   │   │   ├── progress-history.entity.ts
│   │   │   └── user.entity.ts
│   │   ├── enums/                # Database enums
│   │   └── migration/            # Database migrations
│   ├── goal-templates/           # Goal template management
│   │   ├── goal-templates.controller.ts
│   │   ├── goal-templates.service.ts
│   │   └── dto/
│   ├── goals/                    # Goal management
│   │   ├── goals.controller.ts   # CRUD operations for goals
│   │   ├── goals.service.ts      # Goal business logic
│   │   └── dto/                  # Goal DTOs
│   ├── progress-history/         # Progress tracking
│   │   ├── progress-history.controller.ts
│   │   ├── progress-history.service.ts
│   │   └── dto/
│   ├── settings/                 # Application settings
│   ├── users/                    # User management
│   │   ├── users.controller.ts   # User CRUD operations
│   │   ├── users.service.ts      # User business logic
│   │   └── dto/                  # User DTOs
│   ├── test-utils/               # Testing utilities
│   ├── app.controller.ts         # Root application controller
│   ├── app.module.ts             # Root application module
│   ├── app.service.ts            # Root application service
│   └── main.ts                   # Application entry point
├── test/                         # End-to-end tests
├── goaltrack.db                  # SQLite database file
├── server.log                    # Application logs
├── trigger-weekly-processing.js  # Scheduled task script
└── requirements.md               # Project requirements
```

## Core Entities

### User Entity
- **Purpose**: Represents system users (volunteers and admins)
- **Key Fields**: 
  - `id` (UUID primary key)
  - `firstName`, `lastName`, `email`
  - `role` (volunteer/admin)
  - `status` (active/inactive)
  - `phone`, `address`, `skills`
  - `performance` (excellent/good/average/poor)
- **Relationships**: 
  - One-to-many with Goals
  - One-to-many with ProgressHistory
  - One-to-many with ActivityLog

### Goal Entity
- **Purpose**: Represents individual goals assigned to volunteers
- **Key Fields**:
  - `id` (UUID primary key)
  - `title`, `description`, `category`
  - `priority` (high/medium/low)
  - `status` (pending/in-progress/completed/overdue)
  - `progress` (0-100)
  - `dueDate`, `completedAt`
- **Relationships**:
  - Many-to-one with User
  - One-to-many with ProgressHistory

### ProgressHistory Entity
- **Purpose**: Tracks progress updates for goals
- **Key Fields**:
  - `id` (UUID primary key)
  - `progressValue`, `notes`
  - `recordedAt`
- **Relationships**:
  - Many-to-one with User
  - Many-to-one with Goal

### GoalTemplate Entity
- **Purpose**: Predefined goal templates for quick goal creation
- **Key Fields**:
  - `id` (UUID primary key)
  - `title`, `description`, `category`
  - `estimatedDuration`
  - `isActive`

### ActivityLog Entity
- **Purpose**: Audit trail for user actions
- **Key Fields**:
  - `id` (UUID primary key)
  - `action`, `entityType`, `entityId`
  - `metadata`, `timestamp`

## API Modules

### Authentication Module (`/auth`)
- **POST /auth/login** - User authentication
- **POST /auth/register** - User registration
- **POST /auth/logout** - User logout
- **GET /auth/profile** - Get current user profile
- **Middleware**: JWT strategy, Local strategy

### Users Module (`/users`)
- **GET /users** - List all users (admin only)
- **GET /users/:id** - Get user by ID
- **PUT /users/:id** - Update user
- **DELETE /users/:id** - Delete user (admin only)
- **GET /users/:id/goals** - Get user's goals
- **GET /users/:id/analytics** - Get user analytics

### Goals Module (`/goals`)
- **GET /goals** - List goals with filtering
- **POST /goals** - Create new goal
- **GET /goals/:id** - Get goal by ID
- **PUT /goals/:id** - Update goal
- **DELETE /goals/:id** - Delete goal
- **PATCH /goals/:id/progress** - Update goal progress
- **POST /goals/:id/complete** - Mark goal as complete

### Goal Templates Module (`/goal-templates`)
- **GET /goal-templates** - List all templates
- **POST /goal-templates** - Create template (admin only)
- **PUT /goal-templates/:id** - Update template (admin only)
- **DELETE /goal-templates/:id** - Delete template (admin only)

### Progress History Module (`/progress-history`)
- **GET /progress-history** - Get progress history with filters
- **POST /progress-history** - Record progress update
- **GET /progress-history/weekly** - Get weekly summary
- **GET /progress-history/volunteer/:id** - Get volunteer's history

### Analytics Module (`/analytics`)
- **GET /analytics/dashboard** - Get dashboard analytics
- **GET /analytics/goals-overview** - Goal statistics
- **GET /analytics/user-performance** - User performance metrics
- **GET /analytics/trends** - Progress trends
- **GET /analytics/reports** - Generate reports

### Admin Module (`/admin`)
- **GET /admin/dashboard** - Admin dashboard data
- **GET /admin/users** - User management endpoints
- **GET /admin/system-stats** - System statistics
- **POST /admin/bulk-operations** - Bulk operations

## Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Role-based access control

### Authorization Guards
- **JwtAuthGuard**: Protects authenticated routes
- **RolesGuard**: Role-based access control
- **AdminGuard**: Admin-only routes

### Data Validation
- Input validation using class-validator
- DTO transformation with class-transformer
- Request sanitization

## Database Configuration

### Connection
```typescript
// database.config.ts
{
  type: 'sqlite',
  database: 'goaltrack.db',
  entities: [User, Goal, ProgressHistory, GoalTemplate, ActivityLog],
  synchronize: true, // Only for development
  logging: true
}
```

### Migrations
- Located in `src/database/migration/`
- Run migrations: `npm run migration:run`
- Generate migrations: `npm run migration:generate`

## Environment Configuration

### Required Environment Variables
```env
# Application
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=username
DB_PASSWORD=password
DB_DATABASE=goaltrack

# Logging
LOG_LEVEL=debug
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Testing

### Unit Tests
- Located in `*.spec.ts` files alongside source code
- Run tests: `npm run test`
- Coverage: `npm run test:cov`

### E2E Tests
- Located in `test/` directory
- Run E2E tests: `npm run test:e2e`
- Test files: `test/*.e2e-spec.ts`

### Test HTTP Files
Located in `test/` directory for manual API testing:
- `test-auth.http` - Authentication endpoints
- `test-users.http` - User management
- `test-goals.http` - Goal operations
- `test-analytics.http` - Analytics endpoints

## Scheduled Tasks

### Weekly Processing
- File: `trigger-weekly-processing.js`
- Purpose: Generate weekly reports and analytics
- Schedule: Runs every Sunday at midnight
- Features:
  - Goal progress aggregation
  - Performance calculations
  - Automated notifications

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Code Style
- ESLint configuration in `eslint.config.mjs`
- Prettier for code formatting
- TypeScript strict mode enabled

### Debugging
- Debug mode: `npm run start:debug`
- Logs stored in `server.log`
- Debug port: 9229

## Production Deployment

### Build Process
```bash
npm run build
npm run start:prod
```

### Performance Considerations
- Database indexing on frequently queried fields
- Connection pooling for database
- Response caching for analytics endpoints
- File logging for production monitoring

### Monitoring
- Application logs in `server.log`
- Health check endpoint: `GET /health`
- Metrics collection for monitoring tools

## Common Development Tasks

### Adding New Entity
1. Create entity in `src/database/entities/`
2. Add to `entities/index.ts`
3. Create corresponding module, service, controller
4. Add DTOs for validation
5. Update database configuration

### Adding New API Endpoint
1. Add method to appropriate controller
2. Implement business logic in service
3. Create/update DTOs
4. Add proper guards and validation
5. Write tests

### Database Schema Changes
1. Modify entity files
2. Generate migration: `npm run migration:generate`
3. Review migration file
4. Run migration: `npm run migration:run`

## Troubleshooting

### Common Issues
1. **Database Connection**: Check SQLite file permissions
2. **JWT Errors**: Verify JWT_SECRET configuration
3. **CORS Issues**: Update CORS configuration in `main.ts`
4. **Memory Issues**: Check for unresolved promises and memory leaks

### Debugging Tips
- Enable debug logging: Set `LOG_LEVEL=debug`
- Use TypeORM query logging for database issues
- Check `server.log` for detailed error information
- Use NestJS built-in logger for structured logging

## API Documentation
- Swagger/OpenAPI documentation available at `/api/docs` when running in development
- Postman collection available in `test/` directory
- HTTP test files for manual testing

This documentation provides a comprehensive overview of the GoalTrack backend architecture and should help future maintainers understand and work with the codebase effectively.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
