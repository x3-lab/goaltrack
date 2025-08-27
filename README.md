# GoalTrack - Volunteer Goal Tracking System

## 🎯 Project Overview

GoalTrack is a comprehensive volunteer management and goal tracking system designed to help organizations efficiently manage volunteer activities, track progress, and analyze performance. The system features role-based access control with separate dashboards for volunteers and administrators.

## 🏗️ System Architecture

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API for authentication and global state
- **Routing**: React Router v6 with protected routes

### Backend (NestJS/TypeScript)
- **Framework**: NestJS 11.0.1 with TypeScript
- **Database**: SQLite with TypeORM for data management
- **Authentication**: JWT-based with bcrypt password hashing
- **Architecture**: Modular design with controllers, services, and DTOs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goaltrack
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run start:dev
   # Server runs on http://localhost:3001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Application runs on http://localhost:8080
   ```

4. **Access the Application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - Default admin credentials will be created on first run

## 📁 Project Structure

```
goaltrack/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── goals/             # Goal tracking
│   │   ├── analytics/         # Performance analytics
│   │   ├── admin/             # Admin operations
│   │   └── database/          # Database entities and config
│   └── test/                  # API testing files
└── frontend/                  # React frontend application
    ├── src/
    │   ├── components/        # Reusable UI components
    │   ├── pages/            # Application pages/routes
    │   ├── services/         # API service layer
    │   ├── contexts/         # React context providers
    │   └── types/            # TypeScript definitions
    └── public/               # Static assets
```

## 🔑 Key Features

### For Volunteers
- **Personal Dashboard**: Overview of goals, progress, and recent activities
- **Goal Management**: Create, edit, and track personal goals
- **Progress Tracking**: Update goal progress with notes and timestamps
- **Personal Analytics**: Visualize performance trends and achievements
- **Profile Management**: Update personal information and preferences

### For Administrators
- **System Dashboard**: Organization-wide metrics and insights
- **Volunteer Management**: Add, edit, and monitor volunteer accounts
- **Goal Oversight**: System-wide goal management and templates
- **Advanced Analytics**: Comprehensive reporting and data visualization
- **System Configuration**: Manage settings and user permissions

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate permissions for volunteers and admins
- **Password Security**: bcrypt hashing for secure password storage
- **Protected Routes**: Frontend route protection based on authentication status
- **API Security**: Request validation and sanitization

## 📊 Database Schema

### Core Entities
- **Users**: Authentication and profile information
- **Goals**: Goal tracking with progress and metadata
- **Progress History**: Historical progress updates
- **Goal Templates**: Reusable goal templates
- **Settings**: System and user preferences

### Relationships
- Users have many Goals (one-to-many)
- Goals have many Progress History entries (one-to-many)
- Goals can be created from Templates (many-to-one)

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Goal Management
- `GET /goals` - List user goals
- `POST /goals` - Create new goal
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `PATCH /goals/:id/progress` - Update progress

### Analytics
- `GET /analytics/personal` - Personal performance metrics
- `GET /analytics/system` - System-wide analytics (admin only)

## Testing

### Backend Testing
```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test          # Component tests
npm run test:coverage # Coverage report
```

## Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to static hosting service
```

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
DATABASE_URL=./goaltrack.db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
PORT=3001
```

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:3001
```

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Functional components with React hooks
- RESTful API design principles

### Git Workflow
- Feature branch development
- Descriptive commit messages
- Pull request reviews
- Automated testing before merge

### Component Development
- Reusable component design
- TypeScript interface definitions
- Accessibility considerations
- Responsive design patterns

## 📚 Documentation

### Detailed Documentation
- **Backend**: `/backend/README.md` - Comprehensive backend documentation
- **Frontend**: `/frontend/README.md` - Detailed frontend architecture guide

### API Testing
- HTTP test files available in `/backend/test/`
- Postman collection can be generated from OpenAPI documentation

## 🛠️ Maintenance & Support

### Regular Tasks
- Database backup and maintenance
- Dependency updates and security patches
- Performance monitoring and optimization
- User feedback collection and analysis

### Monitoring
- Application logs available in backend/server.log and frontend/frontend.log
- Error tracking and performance metrics
- Database query optimization

### Troubleshooting
- Check server logs for backend issues
- Verify API connectivity for frontend problems
- Database integrity checks for data inconsistencies
- Clear browser cache for frontend caching issues

## 🤝 Contributing

### Setup for Contributors
1. Fork the repository
2. Create feature branch
3. Follow code style guidelines
4. Write tests for new features
5. Submit pull request with description

### Development Standards
- Maintain TypeScript type safety
- Write comprehensive tests
- Follow existing code patterns
- Update documentation for changes

## 📞 Support & Contact

For technical issues or questions:
- Review documentation in backend/ and frontend/ directories
- Check existing issues and solutions
- Contact me: obatulafuad@gmail.com for access issues

## 📄 License

This project is proprietary software developed for volunteer organization management. See license terms for usage restrictions and permissions.

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Maintainers**: X3 Lab Team
