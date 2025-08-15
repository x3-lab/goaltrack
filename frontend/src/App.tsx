import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute, { AdminRoute, VolunteerRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard pages
import AdminDashboard from './pages/AdminDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';

// Admin pages
import AdminProfile from './pages/AdminProfile';
import AdminVolunteerManagement from './pages/AdminVolunteerManagement';
import AdminGoalManagement from './pages/AdminGoalManagement';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminAdvancedAnalytics from './pages/AdminAdvancedAnalytics';

// Volunteer pages
import VolunteerProfile from './pages/VolunteerProfile';
import VolunteerGoals from './pages/VolunteerGoals';

// Shared pages
import Goals from './pages/Goals';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            
            {/* Dashboard redirect */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/profile" element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/volunteers" element={
              <AdminRoute>
                <AdminVolunteerManagement />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/volunteers/:id" element={
              <AdminRoute>
                <VolunteerProfile />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/goals" element={
              <AdminRoute>
                <AdminGoalManagement />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/analytics" element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/settings" element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } />
            
            <Route path="/admin-dashboard/advanced-analytics" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAdvancedAnalytics />
              </ProtectedRoute>
            } />
            
            {/* Volunteer routes */}
            <Route path="/volunteer-dashboard" element={
              <VolunteerRoute>
                <VolunteerDashboard />
              </VolunteerRoute>
            } />
            
            <Route path="/volunteer-dashboard/profile" element={
              <VolunteerRoute>
                <VolunteerProfile />
              </VolunteerRoute>
            } />
            
            <Route path="/volunteer-dashboard/goals" element={
              <VolunteerRoute>
                <VolunteerGoals />
              </VolunteerRoute>
            } />
            
            {/* Shared goal management */}
            <Route path="/goals" element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Helper component to redirect to appropriate dashboard
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/volunteer-dashboard';
  return <Navigate to={redirectPath} replace />;
};

export default App;