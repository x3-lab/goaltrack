import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/loading-spinner';
import { Target, BarChart3, History, User } from 'lucide-react';

interface VolunteerLayoutProps {
  children?: React.ReactNode;
}

const VolunteerLayout: React.FC<VolunteerLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'volunteer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need volunteer access to view this page.</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/volunteer-dashboard",
      icon: Target
    },
    {
      title: "My Goals",
      href: "/volunteer-dashboard/goals",
      icon: Target
    },
    {
      title: "Analytics",
      href: "/volunteer-dashboard/analytics",
      icon: BarChart3
    },
    {
      title: "Progress History",
      href: "/volunteer-dashboard/progress-history",
      icon: History
    },
    {
      title: "Profile",
      href: "/volunteer-dashboard/profile",
      icon: User
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

export default VolunteerLayout;