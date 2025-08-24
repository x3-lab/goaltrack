import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/loading-spinner';
import { Home, Users, Target, BarChart, TrendingUp, FileText, Settings } from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin-dashboard",
      icon: Home
    },
    {
      title: "Volunteers",
      href: "/admin-dashboard/volunteers",
      icon: Users
    },
    {
      title: "Goals",
      href: "/admin-dashboard/goals",
      icon: Target
    },
    {
      title: "Analytics",
      href: "/admin-dashboard/analytics",
      icon: BarChart
    },
    {
      title: "Goal Templates",
      href: "/admin-dashboard/goal-templates",
      icon: FileText
    },
    {
      title: "Settings",
      href: "/admin-dashboard/settings",
      icon: Settings
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation items={navigationItems} />
      <main className="container mx-auto px-4 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;