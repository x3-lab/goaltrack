import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/loading-spinner';
import { Home, Users, Target, BarChart, TrendingUp, FileText, User, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      title: "Profile",
      href: "/admin-dashboard/profile",
      icon: User
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Navigation 
              items={navigationItems} 
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar Navigation*/}
      <div className="hidden md:block">
        <Navigation items={navigationItems} />
      </div>
      
      {/* Main Content Area */}
      <main className="md:ml-64">
        {/* Mobile Header Spacer */}
        <div className="md:hidden h-16" />
        
        <div className="min-h-screen">
          <div className="px-2 sm:px-4 py-6">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;