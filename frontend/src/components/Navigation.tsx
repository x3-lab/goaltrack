import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, BarChart3, Target, Settings, TrendingUp, Calendar, History, Award, User, LogOut, LucideIcon } from 'lucide-react';

interface NavigationItem {
  path?: string;
  href?: string;
  label?: string;
  title?: string;
  icon: LucideIcon;
}

interface NavigationProps {
  items?: NavigationItem[];
  onNavigate?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ items, onNavigate }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      if (onNavigate) onNavigate();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
  ];

  // Use provided items or fall back to default items based on user role
  const navItems = items || (user.role === 'admin' ? adminNavItems : volunteerNavItems);

  return (
    <nav className="bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm fixed w-64 z-30">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {user.role === 'admin' ? 'Admin Panel' : 'Volunteer Portal'}
            </h2>
            <p className="text-sm text-gray-600">
              Welcome, {user.firstName}
            </p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const path = item.path || item.href || '';
              const label = item.label || item.title || '';
              const isActive = location.pathname === path;
              
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={onNavigate}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;