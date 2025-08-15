import React, { useState, useEffect } from 'react';
import { User, Shield, Edit, Save, X, Eye, EyeOff, Users, Target, BarChart3, Phone, Mail, MapPin, Settings, Clock, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  adminApi, 
  type AdminProfileDto, 
  type UpdateAdminProfileDto, 
  type UpdateAdminPreferencesDto,
  type ChangeAdminPasswordDto 
} from '../services/adminApi';
import { 
  settingsApi, 
  type UserPreferencesDto 
} from '../services/settingsApi';

interface AdminProfileState {
  profile: AdminProfileDto | null;
  preferences: UserPreferencesDto | null;
  loading: boolean;
  saving: boolean;
  editMode: boolean;
  showPasswordForm: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  title: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferencesFormData {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  weeklyReports: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  dashboardRefreshInterval: number;
}

const AdminProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<AdminProfileState>({
    profile: null,
    preferences: null,
    loading: true,
    saving: false,
    editMode: false,
    showPasswordForm: false,
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Form states
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    title: ''
  });

  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesFormData, setPreferencesFormData] = useState<PreferencesFormData>({
    theme: 'light',
    timezone: 'America/New_York',
    weeklyReports: true,
    systemAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    dashboardRefreshInterval: 300
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      console.log('👨‍💼 Loading admin profile data...');

      const [profileData, preferencesData] = await Promise.all([
        adminApi.getProfile(),
        user?.id ? settingsApi.getUserPreferences(user.id).catch(() => null) : Promise.resolve(null)
      ]);
      
      setState(prev => ({
        ...prev,
        profile: profileData,
        preferences: preferencesData,
        loading: false
      }));

      // Initialize form data
      setProfileFormData({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || '',
        title: profileData.title || ''
      });

      if (preferencesData) {
        setPreferencesFormData({
          theme: preferencesData.theme,
          timezone: preferencesData.timezone,
          weeklyReports: preferencesData.weeklyReports,
          systemAlerts: profileData.preferences.systemAlerts,
          emailNotifications: preferencesData.emailNotifications,
          smsNotifications: profileData.preferences.smsNotifications,
          dashboardRefreshInterval: preferencesData.dashboardRefreshInterval
        });
      }

      console.log('✅ Admin profile data loaded successfully');

    } catch (error: any) {
      console.error('❌ Error loading profile data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile data",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setState(prev => ({ ...prev, saving: true }));
      
      if (!state.profile) return;

      console.log('💾 Saving admin profile...');

      // Validate form data
      if (!profileFormData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive"
        });
        return;
      }

      const updateData: UpdateAdminProfileDto = {
        name: profileFormData.name.trim(),
        phone: profileFormData.phone.trim() || undefined,
        title: profileFormData.title.trim() || undefined
      };

      const updatedProfile = await adminApi.updateProfile(updateData);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        editMode: false
      }));

      // Update auth context
      if (user) {
        await updateUser({
          ...user,
          name: updatedProfile.name,
          phoneNumber: updatedProfile.phone
        });
      }
      
      toast({
        title: "Profile Updated! ✨",
        description: "Your profile has been updated successfully",
      });

      console.log('✅ Admin profile updated successfully');

    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSavePreferences = async () => {
    try {
      setState(prev => ({ ...prev, saving: true }));
      
      if (!user?.id) return;

      console.log('⚙️ Saving admin preferences...');

      // Update admin-specific preferences
      const adminPreferences: UpdateAdminPreferencesDto = {
        weeklyReports: preferencesFormData.weeklyReports,
        systemAlerts: preferencesFormData.systemAlerts,
        theme: preferencesFormData.theme,
        timezone: preferencesFormData.timezone,
        dashboardRefreshInterval: preferencesFormData.dashboardRefreshInterval,
        emailNotifications: preferencesFormData.emailNotifications,
        smsNotifications: preferencesFormData.smsNotifications
      };

      // Update user preferences via settings API
      const userPreferences = {
        theme: preferencesFormData.theme,
        timezone: preferencesFormData.timezone,
        emailNotifications: preferencesFormData.emailNotifications,
        weeklyReports: preferencesFormData.weeklyReports,
        dashboardRefreshInterval: preferencesFormData.dashboardRefreshInterval
      };

      const [updatedProfile, updatedPreferences] = await Promise.all([
        adminApi.updatePreferences(adminPreferences),
        settingsApi.updateUserPreferences(user.id, userPreferences)
      ]);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        preferences: updatedPreferences
      }));
      
      toast({
        title: "Preferences Updated! ⚙️",
        description: "Your preferences have been saved successfully",
      });

      console.log('✅ Admin preferences updated successfully');

    } catch (error: any) {
      console.error('❌ Error updating preferences:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleChangePassword = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(passwordFormData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordFormData.newPassword);
    const hasNumbers = /\d/.test(passwordFormData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordFormData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast({
        title: "Error",
        description: "Password must contain uppercase, lowercase, number, and special character",
        variant: "destructive"
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true }));
      
      console.log('🔒 Changing admin password...');

      const passwordData: ChangeAdminPasswordDto = {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      };

      await adminApi.changePassword(passwordData);

      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setState(prev => ({ ...prev, showPasswordForm: false }));
      
      toast({
        title: "Password Updated! 🔒",
        description: "Your password has been changed successfully",
      });

      console.log('✅ Admin password changed successfully');

    } catch (error: any) {
      console.error('❌ Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setState(prev => ({
      ...prev,
      showCurrentPassword: field === 'current' ? !prev.showCurrentPassword : prev.showCurrentPassword,
      showNewPassword: field === 'new' ? !prev.showNewPassword : prev.showNewPassword,
      showConfirmPassword: field === 'confirm' ? !prev.showConfirmPassword : prev.showConfirmPassword
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimezoneOptions = () => [
    { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
    { value: 'America/Chicago', label: 'Central Time (UTC-6)' },
    { value: 'America/Denver', label: 'Mountain Time (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Europe/London', label: 'London Time (UTC+0)' },
    { value: 'Europe/Paris', label: 'Central European Time (UTC+1)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (UTC+9)' }
  ];

  const getRefreshIntervalOptions = () => [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' }
  ];

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Profile</h3>
          <p className="text-gray-600">Fetching your admin profile...</p>
        </div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600 mb-4">Failed to load profile data</p>
        <Button onClick={loadProfileData} className="gap-2">
          <Settings className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and system preferences</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                {!state.editMode ? (
                  <Button onClick={() => setState(prev => ({ ...prev, editMode: true }))} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} size="sm" disabled={state.saving}>
                      {state.saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                    <Button 
                      onClick={() => setState(prev => ({ ...prev, editMode: false }))} 
                      variant="outline" 
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  {state.editMode ? (
                    <Input
                      id="name"
                      value={profileFormData.name}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={state.saving}
                      required
                    />
                  ) : (
                    <p className="text-sm font-medium pt-2">{state.profile.name}</p>
                  )}
                </div>

                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{state.profile.email}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {state.editMode ? (
                    <Input
                      id="phone"
                      value={profileFormData.phone}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={state.saving}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 pt-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{state.profile.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Job Title</Label>
                  {state.editMode ? (
                    <Input
                      id="title"
                      value={profileFormData.title}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, title: e.target.value }))}
                      disabled={state.saving}
                      placeholder="Enter job title"
                    />
                  ) : (
                    <div className="flex items-center gap-2 pt-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <p className="text-sm">{state.profile.title || 'System Administrator'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Role & Permissions</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <Badge variant="default">Administrator</Badge>
                  <span className="text-sm text-gray-500">• Full system access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences & Settings
              </CardTitle>
              <CardDescription>Customize your admin experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme & Display */}
              <div>
                <h4 className="font-medium mb-3">Theme & Display</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={preferencesFormData.theme} 
                      onValueChange={(value: 'light' | 'dark' | 'auto') => 
                        setPreferencesFormData(prev => ({ ...prev, theme: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={preferencesFormData.timezone} 
                      onValueChange={(value) => setPreferencesFormData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimezoneOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h4 className="font-medium mb-3">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive important updates via email</p>
                    </div>
                    <Switch
                      checked={preferencesFormData.emailNotifications}
                      onCheckedChange={(checked) => 
                        setPreferencesFormData(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive urgent alerts via SMS</p>
                    </div>
                    <Switch
                      checked={preferencesFormData.smsNotifications}
                      onCheckedChange={(checked) => 
                        setPreferencesFormData(prev => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={preferencesFormData.weeklyReports}
                      onCheckedChange={(checked) => 
                        setPreferencesFormData(prev => ({ ...prev, weeklyReports: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Alerts</Label>
                      <p className="text-sm text-gray-500">Receive system status and security alerts</p>
                    </div>
                    <Switch
                      checked={preferencesFormData.systemAlerts}
                      onCheckedChange={(checked) => 
                        setPreferencesFormData(prev => ({ ...prev, systemAlerts: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Settings */}
              <div>
                <h4 className="font-medium mb-3">Dashboard Settings</h4>
                <div>
                  <Label htmlFor="refreshInterval">Auto-refresh Interval</Label>
                  <Select 
                    value={preferencesFormData.dashboardRefreshInterval.toString()} 
                    onValueChange={(value) => 
                      setPreferencesFormData(prev => ({ ...prev, dashboardRefreshInterval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getRefreshIntervalOptions().map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">How often the dashboard data refreshes automatically</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={state.saving} className="gap-2">
                  {state.saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-500">Change your account password</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setState(prev => ({ ...prev, showPasswordForm: !prev.showPasswordForm }))}
                  >
                    Change Password
                  </Button>
                </div>

                {state.showPasswordForm && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={state.showCurrentPassword ? 'text' : 'password'}
                          value={passwordFormData.currentPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          disabled={state.saving}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {state.showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={state.showNewPassword ? 'text' : 'password'}
                          value={passwordFormData.newPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          disabled={state.saving}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {state.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters with uppercase, lowercase, number, and special character
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={state.showConfirmPassword ? 'text' : 'password'}
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          disabled={state.saving}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {state.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword} disabled={state.saving} className="gap-2">
                        {state.saving ? <LoadingSpinner size="sm" /> : <Shield className="h-4 w-4" />}
                        Update Password
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setState(prev => ({ ...prev, showPasswordForm: false }))}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Volunteers Managed</span>
                  </div>
                  <span className="font-semibold">{state.profile.stats.totalVolunteersManaged}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Goals Oversaw</span>
                  </div>
                  <span className="font-semibold">{state.profile.stats.totalGoalsOversaw}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Last Login</span>
                  </div>
                  <span className="text-sm text-gray-600">{formatDateTime(state.profile.lastLogin)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <Badge variant="default" className="mt-1">Administrator</Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{state.profile.department || 'Administration'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Permissions</p>
                  <p className="text-sm">{state.profile.permissions.length} system permissions</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Last System Maintenance</p>
                  <p className="text-sm">{formatDate(state.profile.stats.lastSystemMaintenance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Bell className="h-4 w-4 mr-2" />
                View System Alerts
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;