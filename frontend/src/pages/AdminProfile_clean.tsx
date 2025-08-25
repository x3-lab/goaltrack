import React, { useState, useEffect } from 'react';
import { User, Shield, Edit, Save, X, Eye, EyeOff, Phone, Mail, MapPin, Clock, UserCircle, CheckCircle, XCircle, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  title?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const profileData = await adminApi.getProfile();
      
      setState(prev => ({
        ...prev,
        profile: profileData,
        loading: false
      }));

      setProfileFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        notes: profileData.notes || ''
      });

    } catch (error: any) {
      console.error('Error loading admin profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleProfileEdit = () => {
    setState(prev => ({ ...prev, editMode: true }));
  };

  const handleProfileCancel = () => {
    setState(prev => ({ ...prev, editMode: false }));
    if (state.profile) {
      setProfileFormData({
        name: state.profile.name || '',
        email: state.profile.email || '',
        phone: state.profile.phone || '',
        address: state.profile.address || '',
        notes: state.profile.notes || ''
      });
    }
  };

  const handleProfileSave = async () => {
    try {
      setState(prev => ({ ...prev, saving: true }));

      const updateData: UpdateAdminProfileDto = {
        name: profileFormData.name.trim() || undefined,
        email: profileFormData.email.trim() || undefined,
        phone: profileFormData.phone.trim() || undefined,
        address: profileFormData.address?.trim() || undefined,
        notes: profileFormData.notes?.trim() || undefined
      };

      const updatedProfile = await adminApi.updateProfile(updateData);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        editMode: false,
        saving: false
      }));

      // Update auth context
      await updateUser({
        ...user!,
        ...updatedProfile
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handlePasswordChange = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true }));

      const changePasswordData: ChangeAdminPasswordDto = {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      };

      await adminApi.changePassword(changePasswordData);

      setState(prev => ({
        ...prev,
        showPasswordForm: false,
        saving: false
      }));

      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (state.loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!state.profile) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Failed to load profile</p>
          <Button onClick={loadProfile}>Try Again</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <UserCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{state.profile.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(state.profile.status)}>
                  {getStatusIcon(state.profile.status)}
                  <span className="ml-1">{state.profile.status}</span>
                </Badge>
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileFormData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileFormData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileFormData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profileFormData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your address"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={profileFormData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional notes"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button onClick={handleProfileCancel} variant="outline" disabled={state.saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleProfileSave} disabled={state.saving}>
                        {state.saving ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{state.profile.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">{state.profile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {state.profile.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Address</p>
                          <p className="text-sm text-gray-600">{state.profile.address}</p>
                        </div>
                      </div>
                    )}

                    {state.profile.notes && (
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Notes</p>
                          <p className="text-sm text-gray-600">{state.profile.notes}</p>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleProfileEdit} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Change your password and manage account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!state.showPasswordForm ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
                      </div>
                      <Button 
                        onClick={() => setState(prev => ({ ...prev, showPasswordForm: true }))}
                        variant="outline"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={state.showCurrentPassword ? 'text' : 'password'}
                          value={passwordFormData.currentPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setState(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                        >
                          {state.showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={state.showNewPassword ? 'text' : 'password'}
                          value={passwordFormData.newPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setState(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                        >
                          {state.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={state.showConfirmPassword ? 'text' : 'password'}
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        >
                          {state.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => setState(prev => ({ ...prev, showPasswordForm: false }))}
                        variant="outline" 
                        disabled={state.saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handlePasswordChange} disabled={state.saving}>
                        {state.saving ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Change Password
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Details Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role</span>
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(state.profile.status)}>
                    {getStatusIcon(state.profile.status)}
                    <span className="ml-1">{state.profile.status}</span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Created</span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(state.profile.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(state.profile.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Administrator Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">Full Access</div>
                  <div className="text-sm text-gray-600">System Administrator</div>
                </div>
                
                <div className="text-center pt-4">
                  <div className="text-sm text-gray-500">
                    You have complete access to all system features including user management, analytics, and administrative functions.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
