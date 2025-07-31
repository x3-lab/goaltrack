import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
  XCircle
} from 'lucide-react';
import type { User as UserType } from '../types/api';

const VolunteerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [volunteer, setVolunteer] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedVolunteer, setEditedVolunteer] = useState<Partial<UserType>>({});

  const volunteerId = id || user?.id || '';
  const isOwnProfile = !id || id === user?.id;
  const canEdit = isOwnProfile || user?.role === 'admin';

  useEffect(() => {
    if (volunteerId) {
      loadVolunteer();
    }
  }, [volunteerId]);

  const loadVolunteer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await usersApi.getById(volunteerId);
      setVolunteer(data);
      setEditedVolunteer(data);
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
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedVolunteer(volunteer || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedVolunteer(volunteer || {});
  };

  const handleSave = async () => {
    if (!volunteer) return;

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

      const updatedVolunteer = await usersApi.update(volunteer.id, updateData);
      setVolunteer(updatedVolunteer);
      setIsEditing(false);
      
      // If editing own profile, update auth context
      if (isOwnProfile) {
        await updateUser(updatedVolunteer);
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
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
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !volunteer) {
    return (
      <div className="text-center py-12">
        <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error || 'Volunteer not found'}</p>
        <Button onClick={loadVolunteer}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <UserCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{volunteer.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(volunteer.status)}>
                {getStatusIcon(volunteer.status)}
                <span className="ml-1">{volunteer.status}</span>
              </Badge>
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                {volunteer.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedVolunteer.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <p className="text-sm font-medium pt-2">{volunteer.name}</p>
                )}
              </div>

              <div>
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{volunteer.email}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedVolunteer.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={saving}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 pt-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{volunteer.phone || 'Not provided'}</p>
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  {isEditing ? (
                    <Select 
                      value={editedVolunteer.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
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
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={editedVolunteer.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={saving}
                  placeholder="Enter address"
                  rows={2}
                />
              ) : (
                <div className="flex items-start gap-2 pt-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm">{volunteer.address || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="skills">Skills & Interests</Label>
              {isEditing ? (
                <Textarea
                  id="skills"
                  value={editedVolunteer.skills || ''}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  disabled={saving}
                  placeholder="Describe skills and interests"
                  rows={3}
                />
              ) : (
                <div className="pt-2">
                  <p className="text-sm">{volunteer.skills || 'Not provided'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">{formatDate(volunteer.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{formatDate(volunteer.updatedAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <Badge variant="outline" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {volunteer.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions (for admin) */}
          {user?.role === 'admin' && !isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Goal assignment feature will be available soon" })}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Assign Goals
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Messaging feature will be available soon" })}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;