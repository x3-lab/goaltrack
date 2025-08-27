# GoalTrack Frontend Documentation

## Overview
The GoalTrack frontend is a modern React application built with TypeScript and Vite. It provides an intuitive user interface for volunteer management, goal tracking, and analytics visualization. The application features role-based dashboards for both volunteers and administrators.

## Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: React Context API + hooks
- **HTTP Client**: Axios
- **Charts**: Recharts for data visualization
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Vitest + React Testing Library
- **Accessibility**: @axe-core/react for accessibility testing

## Project Structure

```
frontend/
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── toast.tsx
│   │   ├── analytics/            # Analytics components
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── AddVolunteerForm.tsx  # Volunteer registration form
│   │   ├── AdminLayout.tsx       # Admin dashboard layout
│   │   ├── enhanced-goal-form.tsx # Advanced goal creation form
│   │   ├── GoalCard.tsx          # Goal display component
│   │   ├── GoalFormModal.tsx     # Goal creation modal
│   │   ├── GoalTemplateModal.tsx # Template management modal
│   │   ├── Header.tsx            # Page header component
│   │   ├── Navigation.tsx        # Sidebar navigation
│   │   ├── PersonalAnalytics.tsx # User analytics component
│   │   ├── ProgressHistory.tsx   # Progress tracking component
│   │   ├── ProgressUpdate.tsx    # Progress update form
│   │   ├── ProtectedRoute.tsx    # Route authentication wrapper
│   │   ├── VolunteerLayout.tsx   # Volunteer dashboard layout
│   │   └── WeeklyProgressSummary.tsx # Weekly progress display
│   ├── contexts/                 # React Context providers
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-local-storage.ts  # Local storage hook
│   │   └── use-toast.ts          # Toast notification hook
│   ├── lib/                      # Utility libraries
│   │   └── utils.ts              # Common utility functions
│   ├── pages/                    # Application pages/routes
│   │   ├── admin/                # Admin-specific pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminAnalytics.tsx
│   │   │   ├── AdminAdvancedAnalytics.tsx
│   │   │   ├── AdminGoalManagement.tsx
│   │   │   ├── AdminGoalTemplates.tsx
│   │   │   ├── AdminProfile.tsx
│   │   │   ├── AdminVolunteerManagement.tsx
│   │   │   └── UnifiedAdminAnalytics.tsx
│   │   ├── volunteer/            # Volunteer-specific pages
│   │   │   ├── VolunteerDashboard.tsx
│   │   │   ├── VolunteerGoals.tsx
│   │   │   ├── VolunteerProfile.tsx
│   │   │   ├── PersonalAnalytics.tsx
│   │   │   └── ProgressHistory.tsx
│   │   ├── auth/                 # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Index.tsx             # Landing page
│   │   └── NotFound.tsx          # 404 error page
│   ├── services/                 # API service layer
│   │   ├── api.ts                # Base API configuration
│   │   ├── authApi.ts            # Authentication API calls
│   │   ├── usersApi.ts           # User management API
│   │   ├── goalsApi.ts           # Goal management API
│   │   ├── goalTemplatesApi.ts   # Goal templates API
│   │   ├── progressHistoryApi.ts # Progress tracking API
│   │   └── analyticsApi.ts       # Analytics API
│   ├── types/                    # TypeScript type definitions
│   │   └── api.ts                # API response types
│   ├── utils/                    # Utility functions
│   │   └── date.ts               # Date manipulation utilities
│   ├── App.tsx                   # Root application component
│   ├── main.tsx                  # Application entry point
│   ├── index.css                 # Global styles
│   └── App.css                   # Component-specific styles
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
└── postcss.config.js             # PostCSS configuration
```

## Core Features

### 📊 **Dual Dashboard System**
- **Volunteer Dashboard**: Personal goal tracking, progress monitoring, analytics
- **Admin Dashboard**: System-wide management, user oversight, comprehensive analytics

### 🔐 **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Volunteer/Admin)
- Protected routes with automatic redirects
- Persistent login state

### 🎯 **Goal Management**
- Create, edit, delete goals
- Progress tracking with visual indicators
- Goal templates for quick creation
- Priority and status management
- Due date tracking and overdue notifications

### 📈 **Analytics & Reporting**
- Personal performance metrics
- System-wide analytics for admins
- Progress visualization with charts
- Weekly/monthly progress summaries
- Performance trending

### 👥 **User Management** (Admin Only)
- Volunteer registration and management
- User profile editing
- Performance tracking
- Bulk operations

## Application Architecture

### State Management
```typescript
// AuthContext.tsx - Global authentication state
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

### API Service Layer
```typescript
// services/api.ts - Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic token attachment and refresh
api.interceptors.request.use(/* token attachment */);
api.interceptors.response.use(/* error handling */);
```

### Component Organization
- **Layouts**: Shared layout components for different user roles
- **Pages**: Route-level components representing full pages
- **Components**: Reusable UI components
- **UI**: Low-level design system components (shadcn/ui)

## Key Components

### Layout Components

#### VolunteerLayout
- Provides consistent layout for volunteer pages
- Includes navigation sidebar
- Mobile-responsive with collapsible menu
- Role-based navigation items

#### AdminLayout
- Admin-specific layout with expanded navigation
- System-wide controls and quick actions
- Advanced filtering and bulk operation tools

### Page Components

#### Dashboard Pages
- **VolunteerDashboard**: Personal overview, recent goals, quick stats
- **AdminDashboard**: System metrics, user summaries, recent activities

#### Goal Management
- **VolunteerGoals**: Personal goal list with filtering and search
- **AdminGoalManagement**: System-wide goal oversight and management

#### Analytics
- **PersonalAnalytics**: Individual performance metrics and trends
- **AdminAnalytics**: Comprehensive system analytics and reporting

#### Profile Management
- **VolunteerProfile**: Personal profile editing and settings
- **AdminProfile**: Admin account management

### Form Components

#### EnhancedGoalForm
```typescript
interface GoalFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags?: string[];
}
```

#### ProgressUpdate
- Progress value input (0-100%)
- Notes and comments
- Timestamp tracking
- Validation and error handling

### Data Visualization
- **Charts**: Recharts integration for progress visualization
- **Progress Bars**: Visual progress indicators
- **Statistics Cards**: Metric display components
- **Tables**: Data listing with sorting and filtering

## Routing Structure

```typescript
// App.tsx - Route configuration
const routes = [
  // Public routes
  { path: '/', element: <Index /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  
  // Volunteer routes (protected)
  { path: '/volunteer-dashboard', element: <VolunteerDashboard /> },
  { path: '/volunteer-dashboard/goals', element: <VolunteerGoals /> },
  { path: '/volunteer-dashboard/analytics', element: <PersonalAnalytics /> },
  { path: '/volunteer-dashboard/progress-history', element: <ProgressHistory /> },
  { path: '/volunteer-dashboard/profile', element: <VolunteerProfile /> },
  
  // Admin routes (protected, admin-only)
  { path: '/admin-dashboard', element: <AdminDashboard /> },
  { path: '/admin-dashboard/volunteers', element: <AdminVolunteerManagement /> },
  { path: '/admin-dashboard/goals', element: <AdminGoalManagement /> },
  { path: '/admin-dashboard/analytics', element: <AdminAnalytics /> },
  { path: '/admin-dashboard/goal-templates', element: <AdminGoalTemplates /> },
  { path: '/admin-dashboard/profile', element: <AdminProfile /> },
];
```

## API Integration

### Service Pattern
Each API service follows a consistent pattern:

```typescript
// services/goalsApi.ts
export const goalsApi = {
  getAll: (filters?: GoalFilters) => api.get('/goals', { params: filters }),
  getById: (id: string) => api.get(`/goals/${id}`),
  create: (data: CreateGoalDto) => api.post('/goals', data),
  update: (id: string, data: UpdateGoalDto) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  updateProgress: (id: string, progress: number) => api.patch(`/goals/${id}/progress`, { progress }),
};
```

### Error Handling
- Global error interceptors
- User-friendly error messages
- Automatic retry for failed requests
- Loading state management

### Data Fetching Patterns
```typescript
// Custom hook for data fetching
const useGoals = (filters?: GoalFilters) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await goalsApi.getAll(filters);
        setGoals(response.data);
      } catch (err) {
        setError('Failed to fetch goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [filters]);

  return { goals, loading, error, refetch: fetchGoals };
};
```

## Styling & Design System

### Tailwind CSS Configuration
```typescript
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Additional color palette
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### Component Styling Patterns
- Consistent spacing using Tailwind scale
- Responsive design with mobile-first approach
- Dark mode support (configurable)
- Accessible color contrasts

### UI Component Library
Based on shadcn/ui with customizations:
- Consistent component APIs
- Built-in accessibility features
- Customizable theming
- TypeScript support

## State Management Patterns

### Context API Usage
```typescript
// Centralized state management for authentication
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication methods
  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Local State Patterns
- useState for component-specific state
- useEffect for side effects and data fetching
- Custom hooks for shared logic
- useCallback/useMemo for performance optimization

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run type-check
```

### Code Organization
- Functional components with hooks
- TypeScript strict mode
- ESLint + Prettier for code quality
- File naming conventions (PascalCase for components)

### Testing Strategy
```typescript
// Component testing example
describe('GoalCard', () => {
  it('renders goal information correctly', () => {
    const mockGoal = {
      id: '1',
      title: 'Test Goal',
      progress: 75,
      status: 'in-progress'
    };
    
    render(<GoalCard goal={mockGoal} />);
    
    expect(screen.getByText('Test Goal')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Code Splitting
- Route-based code splitting with React.lazy
- Component lazy loading for large components
- Dynamic imports for heavy dependencies

### Caching Strategies
- API response caching
- Local storage for user preferences
- Memoization for expensive calculations

### Bundle Optimization
- Tree shaking for unused code elimination
- Asset optimization with Vite
- Chunk splitting for efficient loading

## Accessibility Features

### WCAG Compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

### Testing
- @axe-core/react for automated accessibility testing
- Manual testing with screen readers
- Color contrast validation

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox support
- Progressive Web App capabilities

## Environment Configuration

### Environment Variables
```env
# .env.local
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=GoalTrack
VITE_ENABLE_ANALYTICS=true
```

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## Deployment

### Production Build
```bash
npm run build
# Generates optimized build in dist/ directory
```

### Static Hosting
- Compatible with Vercel, Netlify, AWS S3
- SPA routing configuration required
- Environment variable configuration for production API

## Common Development Tasks

### Adding New Page
1. Create component in `src/pages/`
2. Add route to `App.tsx`
3. Update navigation if needed
4. Add to appropriate layout
5. Implement error boundaries

### Adding New API Service
1. Create service file in `src/services/`
2. Define TypeScript interfaces
3. Implement CRUD operations
4. Add error handling
5. Create custom hooks if needed

### Creating Reusable Component
1. Create component in `src/components/`
2. Define TypeScript props interface
3. Implement with accessibility in mind
4. Add to component exports
5. Write tests and documentation

## Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript types and imports
2. **API Connection**: Verify backend server is running and CORS is configured
3. **Authentication**: Check token storage and API interceptors
4. **Routing**: Verify protected route configuration

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console logging for state debugging

This documentation provides a comprehensive guide to the GoalTrack frontend architecture and development practices for future maintainers.
