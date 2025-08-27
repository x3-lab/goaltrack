import React, { useState, useEffect } from 'react';
import { User, Shield, Edit, Save, X, Eye, EyeOff, Phone, Mail, MapPin, Clock, UserCircle, CheckCircle, XCircle, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '../components/AdminLayout';
import { 
  adminApi, 
  type AdminProfileDto, 
  type UpdateAdminProfileDto,
  type ChangeAdminPasswordDto 
} from '../services/adminApi';

interface AdminProfileState {
  profile: AdminProfileDto | null;
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
  address?: string;
  notes?: string;
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
    phone: ''
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

      const [profileData] = await Promise.all([
        adminApi.getProfile(),
      ]);
      
      setState(prev => ({
        ...prev,
        profile: profileData,
        loading: false
      }));

      // Initialize form data
      setProfileFormData({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || '',
      });

      console.log('Admin profile data loaded successfully');

    } catch (error: any) {
      console.error('Error loading profile data:', error);
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

      console.log('Saving admin profile...');

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

      console.log('Admin profile updated successfully');

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
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
      
      console.log('Changing admin password...');

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
        title: "Password Updated!",
        description: "Your password has been changed successfully",
      });

      console.log('Admin password changed successfully');

    } catch (error: any) {
      console.error('Error changing password:', error);
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



  if (state.loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Profile</h3>
            <p className="text-gray-600">Fetching your admin profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!state.profile) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">Failed to load profile data</p>
          <Button onClick={loadProfileData} className="gap-2">
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and system preferences</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2 w-fit">
            <Shield className="h-4 w-4" />
            Administrator
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  {!state.editMode ? (
                    <Button onClick={() => setState(prev => ({ ...prev, editMode: true }))} variant="outline" className="w-full sm:w-auto">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handleSaveProfile} size="sm" disabled={state.saving} className="w-full sm:w-auto">
                        {state.saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button 
                        onClick={() => setState(prev => ({ ...prev, editMode: false }))} 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name">Full Name *</Label>
                    {state.editMode ? (
                      <Input
                        id="name"
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={state.saving}
                        required
                        className="text-left"
                      />
                    ) : (
                      <p className="text-sm font-medium pt-2 text-left">{state.profile.name}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-left">
                    <Label>Email Address</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-left break-all">{state.profile.email}</p>
                    </div>
                    <p className="text-xs text-gray-500 text-left">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="phone">Phone Number</Label>
                    {state.editMode ? (
                      <Input
                        id="phone"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={state.saving}
                        placeholder="Enter phone number"
                        className="text-left"
                      />
                    ) : (
                      <div className="flex items-center gap-2 pt-2">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-left">{state.profile.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-left">
                    <Label>Role & Permissions</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <Badge variant="default">Administrator</Badge>
                    </div>
                  </div>
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
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-gray-500">Change your account password</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setState(prev => ({ ...prev, showPasswordForm: !prev.showPasswordForm }))}
                      className="w-full sm:w-auto"
                    >
                      Change Password
                    </Button>
                  </div>

                  {state.showPasswordForm && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password *</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={state.showCurrentPassword ? 'text' : 'password'}
                            value={passwordFormData.currentPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            disabled={state.saving}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {state.showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password *</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={state.showNewPassword ? 'text' : 'password'}
                            value={passwordFormData.newPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            disabled={state.saving}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {state.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 text-left">
                          Must be at least 8 characters with uppercase, lowercase, number, and special character
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={state.showConfirmPassword ? 'text' : 'password'}
                            value={passwordFormData.confirmPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            disabled={state.saving}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {state.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleChangePassword} disabled={state.saving} className="gap-2 w-full sm:w-auto">
                          {state.saving ? <LoadingSpinner size="sm" /> : <Shield className="h-4 w-4" />}
                          Update Password
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setState(prev => ({ ...prev, showPasswordForm: false }))}
                          className="w-full sm:w-auto"
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
            {/* Profile Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCircle className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{state.profile.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{state.profile.email}</p>
                  <Badge variant="default" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Administrator
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Account Active</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Last Login</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(state.profile.lastLogin).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setState(prev => ({ ...prev, editMode: true }))}
                  disabled={state.editMode}
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setState(prev => ({ ...prev, showPasswordForm: true }))}
                >
                  <Shield className="h-4 w-4" />
                  Change Password
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={loadProfileData}
                  disabled={state.loading}
                >
                  {state.loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <UserCircle className="h-4 w-4" />
                  )}
                  Refresh Profile
                </Button>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profile Strength</span>
                    <span className="text-sm font-medium">
                      {state.profile.phone ? '85%' : '70%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: state.profile.phone ? '85%' : '70%' }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-gray-600">Name provided</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-gray-600">Email verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {state.profile.phone ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-gray-600">Phone number</span>
                    </div>
                  </div>
                  
                  {!state.profile.phone && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        Add your phone number to complete your profile and improve security.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;