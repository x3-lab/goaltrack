
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api, type Volunteer } from '../services/api';
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
  Star
} from 'lucide-react';

const VolunteerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVolunteer, setEditedVolunteer] = useState<Partial<Volunteer>>({});

  // Determine which volunteer to load - use ID from URL if available, otherwise use current user
  const volunteerId = id || user?.id || '1';
  const isOwnProfile = !id || id === user?.id;
  const canEdit = isOwnProfile || user?.role === 'admin';

  useEffect(() => {
    loadVolunteer();
  }, [volunteerId]);

  const loadVolunteer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.volunteers.getById(volunteerId);
      
      if (data) {
        setVolunteer(data);
        setEditedVolunteer(data);
      } else {
        setError('Volunteer not found');
      }
    } catch (err) {
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
      const updatedVolunteer = await api.volunteers.update(volunteer.id, editedVolunteer);
      setVolunteer(updatedVolunteer);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    } catch (err) {
      console.error('Error updating volunteer:', err);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: keyof Volunteer, value: string) => {
    setEditedVolunteer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'high': return <Star className="h-4 w-4" />;
      case 'medium': return <UserCircle className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      default: return <UserCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadVolunteer} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Volunteer not found</p>
        <Button onClick={loadVolunteer} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwnProfile ? 'My Profile' : `${volunteer.name}'s Profile`}
          </h1>
          <p className="text-gray-600 mt-1">
            {isOwnProfile ? 'Manage your profile information' : 'View volunteer profile details'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(volunteer.status)}>
            {volunteer.status}
          </Badge>
          <Button onClick={loadVolunteer} variant="outline" size="sm">
            Refresh
          </Button>
          {canEdit && (
            <>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
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
                {isEditing && canEdit ? (
                  <Input
                    id="name"
                    value={editedVolunteer.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{volunteer.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                {isEditing && canEdit ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedVolunteer.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{volunteer.email}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                {isEditing && canEdit ? (
                  <Input
                    id="phone"
                    value={editedVolunteer.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{volunteer.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                {isEditing && canEdit ? (
                  <Select
                    value={editedVolunteer.role || ''}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="team-leader">Team Leader</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900 capitalize">{volunteer.role}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              {isEditing && canEdit ? (
                <Textarea
                  id="address"
                  value={editedVolunteer.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              ) : (
                <div className="mt-1 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-900">{volunteer.address || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="skills">Skills & Expertise</Label>
              {isEditing && canEdit ? (
                <Textarea
                  id="skills"
                  value={editedVolunteer.skills || ''}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  className="mt-1"
                  rows={2}
                  placeholder="e.g., Event planning, Communication, Technical support..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{volunteer.skills || 'Not specified'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              {isEditing && canEdit ? (
                <Textarea
                  id="notes"
                  value={editedVolunteer.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{volunteer.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status & Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge className={getStatusColor(volunteer.status)}>
                  {volunteer.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Performance</span>
                <div className={`flex items-center gap-1 ${getPerformanceColor(volunteer.performance)}`}>
                  {getPerformanceIcon(volunteer.performance)}
                  <span className="text-sm font-medium capitalize">{volunteer.performance}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Goals Count</span>
                <span className="text-sm font-semibold">{volunteer.goalsCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                <span className="text-sm font-semibold">{volunteer.completionRate}%</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Joined:</span>
                  <span className="text-sm font-medium">
                    {new Date(volunteer.joinDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Last Active:</span>
                  <span className="text-sm font-medium">
                    {new Date(volunteer.lastActive).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VolunteerProfile;