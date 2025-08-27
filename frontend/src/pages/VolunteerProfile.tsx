import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usersApi } from '../services/usersApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Edit, 
  Save, 
  X, 
  UserCircle,
  Shield,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Settings,
  Award,
  Target
} from 'lucide-react';
import type { User as UserType } from '../types/api';
import VolunteerLayout from '../components/VolunteerLayout';

const VolunteerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [volunteer, setVolunteer] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedVolunteer, setEditedVolunteer] = useState<Partial<UserType>>({});
  const [refreshing, setRefreshing] = useState(false);

  const volunteerId = id || user?.id || '';
  const isOwnProfile = !id || id === user?.id;
  const canEdit = isOwnProfile || user?.role === 'admin';

  useEffect(() => {
    if (volunteerId) {
      loadVolunteer();
    }
  }, [volunteerId]);

  const loadVolunteer = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      console.log('Loading volunteer profile...');
      const data = await usersApi.getById(volunteerId);
      setVolunteer(data);
      setEditedVolunteer(data);
      console.log('Volunteer profile loaded successfully');
    } catch (err: any) {
      console.error('Error loading volunteer:', err);
      setError('Failed to load volunteer profile');
      toast({
        title: 'Error',
        description: 'Failed to load volunteer profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadVolunteer(true);
    toast({
      title: "Profile Refreshed",
      description: "Profile information has been updated.",
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedVolunteer(volunteer || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedVolunteer(volunteer || {});
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!editedVolunteer.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (editedVolunteer.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(editedVolunteer.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    return errors;
  };

  const calculateProfileCompleteness = (volunteerData: UserType) => {
    const fields = ['name', 'email', 'phone', 'address', 'skills'];
    const completedFields = fields.filter(field => volunteerData[field as keyof UserType]);
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const handleSave = async () => {
    if (!volunteer) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join('. '),
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: editedVolunteer.name?.trim(),
        phone: editedVolunteer.phone?.trim() || undefined,
        address: editedVolunteer.address?.trim() || undefined,
        skills: editedVolunteer.skills?.trim() || undefined,
        ...(user?.role === 'admin' && {
          status: editedVolunteer.status
        })
      };

      console.log('Updating volunteer profile...');
      const updatedVolunteer = await usersApi.update(volunteer.id, updateData);
      setVolunteer(updatedVolunteer);
      setIsEditing(false);
      
      // If editing own profile, update auth context
      if (isOwnProfile) {
        const authUserUpdate = {
          ...updatedVolunteer,
          skills: updatedVolunteer.skills ? updatedVolunteer.skills.split(',').map(s => s.trim()) : []
        };
        await updateUser(authUserUpdate);
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      console.log('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserType, value: string) => {
    setEditedVolunteer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  if (error || !volunteer) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mt-20">
            <UserCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Profile Not Found</h3>
            <p className="text-red-700 mb-4">{error || 'The requested volunteer profile could not be found.'}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => loadVolunteer()} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/volunteer-dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  const profileCompleteness = calculateProfileCompleteness(volunteer);

  return (
    <VolunteerLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{volunteer.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(volunteer.status)}>
                      {getStatusIcon(volunteer.status)}
                      <span className="ml-1 capitalize">{volunteer.status}</span>
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      <Shield className="h-3 w-3 mr-1" />
                      {volunteer.role}
                    </Badge>
                    {isOwnProfile && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Target className="h-3 w-3 mr-1" />
                        {profileCompleteness}% Complete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {canEdit && (
                  <>
                    {!isEditing ? (
                      <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => navigate('/volunteer-dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedVolunteer.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={saving}
                          className="mt-1"
                          placeholder="Enter full name"
                        />
                      ) : (
                        <p className="text-sm font-medium pt-2 text-gray-900">{volunteer.name}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <p className="text-sm text-gray-900">{volunteer.email}</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedVolunteer.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={saving}
                          placeholder="Enter phone number"
                          className="mt-1"
                        />
                      ) : (
                        <div className="flex items-center gap-2 pt-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <p className="text-sm text-gray-900">{volunteer.phone || 'Not provided'}</p>
                        </div>
                      )}
                    </div>

                    {user?.role === 'admin' && (
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">Account Status</Label>
                        {isEditing ? (
                          <Select 
                            value={editedVolunteer.status} 
                            onValueChange={(value) => handleInputChange('status', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2 pt-2">
                            {getStatusIcon(volunteer.status)}
                            <Badge className={getStatusColor(volunteer.status)}>
                              {volunteer.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={editedVolunteer.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={saving}
                        placeholder="Enter your address"
                        rows={2}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-start gap-2 pt-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                        <p className="text-sm text-gray-900">{volunteer.address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="skills" className="text-sm font-medium text-gray-700">Skills & Interests</Label>
                    {isEditing ? (
                      <Textarea
                        id="skills"
                        value={editedVolunteer.skills || ''}
                        onChange={(e) => handleInputChange('skills', e.target.value)}
                        disabled={saving}
                        placeholder="Describe your skills, interests, and areas of expertise..."
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <div className="pt-2">
                        <p className="text-sm text-gray-900">{volunteer.skills || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Profile Completeness */}
              {isOwnProfile && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Target className="h-5 w-5 text-green-600" />
                      Profile Completeness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-gray-900">{profileCompleteness}%</span>
                      </div>
                      <Progress value={profileCompleteness} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Complete your profile to help others learn more about you and your skills.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                    <p className="font-medium text-gray-900">{formatDate(volunteer.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <p className="text-sm text-gray-900">{formatDate(volunteer.updatedAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Account Type</p>
                    <Badge variant="outline" className="mt-1 border-purple-200 text-purple-700">
                      <Shield className="h-3 w-3 mr-1" />
                      {volunteer.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions (for admin) */}
              {user?.role === 'admin' && !isOwnProfile && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Admin Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start hover:bg-blue-50 border-blue-200 text-blue-700"
                      onClick={() => toast({ title: "Feature Coming Soon", description: "Goal assignment feature will be available soon" })}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Assign Goals
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start hover:bg-green-50 border-green-200 text-green-700"
                      onClick={() => toast({ title: "Feature Coming Soon", description: "Messaging feature will be available soon" })}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start hover:bg-purple-50 border-purple-200 text-purple-700"
                      onClick={() => navigate(`/volunteer-dashboard/analytics`)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </VolunteerLayout>
  );
};

export default VolunteerProfile;