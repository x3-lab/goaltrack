import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, BarChart3, Target, Settings, TrendingUp, Calendar, History, Award, User, LucideIcon } from 'lucide-react';

interface NavigationItem {
  path?: string;
  href?: string;
  label?: string;
  title?: string;
  icon: LucideIcon;
}

interface NavigationProps {
  items?: NavigationItem[];
}

const Navigation: React.FC<NavigationProps> = ({ items }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const volunteerNavItems = [
    { path: '/volunteer-dashboard', label: 'Dashboard', icon: Target },
    { path: '/volunteer-dashboard/progress-history', label: 'Progress History', icon: History },
    { path: '/volunteer-dashboard/analytics', label: 'Personal Analytics', icon: BarChart3 },
    { path: '/volunteer-dashboard/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { path: '/admin-dashboard', label: 'Overview', icon: BarChart3 },
    { path: '/admin-dashboard/volunteers', label: 'Volunteers', icon: Users },
    { path: '/admin-dashboard/goals', label: 'All Goals', icon: Target },
    { path: '/admin-dashboard/goal-templates', label: 'Goal Templates', icon: Target },
    { path: '/admin-dashboard/analytics', label: 'System Analytics', icon: TrendingUp },
    { path: '/admin-dashboard/profile', label: 'Profile', icon: User },
    { path: '/admin-dashboard/settings', label: 'Settings', icon: Settings },
  ];

  // Use provided items or fall back to default items based on user role
  const navItems = items || (user.role === 'admin' ? adminNavItems : volunteerNavItems);

  return (
    <nav className="bg-gray-50 border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {user.role === 'admin' ? 'Admin Panel' : 'Volunteer Portal'}
          </h2>
          <p className="text-sm text-gray-600">
            Welcome, {user.name}
          </p>
        </div>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const path = item.path || item.href || '';
            const label = item.label || item.title || '';
            const isActive = location.pathname === path;
            
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;