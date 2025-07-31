import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from './ui/loading-spinner';
import { usersApi, type Volunteer, type CreateVolunteerRequest } from '../services/usersApi';

interface AddVolunteerFormProps {
  onSuccess?: (volunteer: Volunteer) => void;
  onCancel?: () => void;
}

interface VolunteerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  skills: string;
  notes: string;
  status: 'active' | 'inactive';
  generatePassword: boolean;
  customPassword: string;
}

const AddVolunteerForm: React.FC<AddVolunteerFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VolunteerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    skills: '',
    notes: '',
    status: 'active',
    generatePassword: true,
    customPassword: '',
  });

  const [errors, setErrors] = useState<Partial<VolunteerFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<VolunteerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.generatePassword && formData.customPassword.length < 6) {
      newErrors.customPassword = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const volunteerData: CreateVolunteerRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        skills: formData.skills.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        role: 'volunteer',
        password: formData.generatePassword ? undefined : formData.customPassword,
      };

      const newVolunteer = await usersApi.create(volunteerData);

      toast({
        title: "Success",
        description: `Volunteer ${newVolunteer.name} has been added successfully${
          formData.generatePassword ? '. A temporary password has been generated.' : ''
        }`,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        skills: '',
        notes: '',
        status: 'active',
        generatePassword: true,
        customPassword: '',
      });

      if (onSuccess) {
        onSuccess(newVolunteer);
      }
    } catch (error: any) {
      console.error('Error creating volunteer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add volunteer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VolunteerFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Volunteer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  disabled={loading}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  disabled={loading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                disabled={loading}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                disabled={loading}
                rows={2}
              />
            </div>
          </div>

          {/* Skills and Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skills & Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills & Interests (Optional)</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                placeholder="Enter skills, interests, or areas of expertise"
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or comments"
                disabled={loading}
                rows={2}
              />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={formData.generatePassword}
                  onChange={(e) => handleInputChange('generatePassword', e.target.checked)}
                  disabled={loading}
                  className="rounded"
                />
                <Label htmlFor="generatePassword">Generate temporary password automatically</Label>
              </div>

              {!formData.generatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="customPassword">Custom Password *</Label>
                  <Input
                    id="customPassword"
                    type="password"
                    value={formData.customPassword}
                    onChange={(e) => handleInputChange('customPassword', e.target.value)}
                    placeholder="Enter custom password"
                    disabled={loading}
                    className={errors.customPassword ? 'border-red-500' : ''}
                  />
                  {errors.customPassword && (
                    <p className="text-sm text-red-600">{errors.customPassword}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding Volunteer...
                </>
              ) : (
                'Add Volunteer'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddVolunteerForm;