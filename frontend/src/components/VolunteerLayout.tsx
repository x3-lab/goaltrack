import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/loading-spinner';
import { Target, BarChart3, History, User, Menu, X, Home } from 'lucide-react';

interface VolunteerLayoutProps {
  children?: React.ReactNode;
}

const VolunteerLayout: React.FC<VolunteerLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      icon: Home
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
      
      {/* Desktop Sidebar Navigation */}
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

export default VolunteerLayout;