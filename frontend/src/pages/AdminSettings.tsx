import React, { useState, useEffect } from 'react';
import { Settings, Database, Download, Upload, AlertCircle, RefreshCw, Save, RotateCcw, Shield, Bell, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '../components/AdminLayout';
import { 
  settingsApi, 
  type SystemConfigDto, 
  type SettingResponseDto,
  type BulkUpdateSettingsDto 
} from '../services/settingsApi';

interface AdminSettingsState {
  config: SystemConfigDto | null;
  allSettings: SettingResponseDto[];
  loading: boolean;
  saving: boolean;
  exporting: boolean;
  importing: boolean;
  hasChanges: boolean;
}

interface SystemConfigFormData extends SystemConfigDto {}

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<AdminSettingsState>({
    config: null,
    allSettings: [],
    loading: true,
    saving: false,
    exporting: false,
    importing: false,
    hasChanges: false
  });

  const [formData, setFormData] = useState<SystemConfigFormData>({
    organizationName: '',
    maxGoalsPerWeek: 5,
    defaultGoalDuration: 7,
    dataRetentionMonths: 12,
    backupFrequencyHours: 24,
    emailNotificationsEnabled: true,
    reminderDaysBeforeDeadline: 3,
    sessionTimeoutMinutes: 60,
    analyticsEnabled: true,
    goalTemplatesEnabled: true
  });

  const [originalFormData, setOriginalFormData] = useState<SystemConfigFormData>({
    organizationName: '',
    maxGoalsPerWeek: 5,
    defaultGoalDuration: 7,
    dataRetentionMonths: 12,
    backupFrequencyHours: 24,
    emailNotificationsEnabled: true,
    reminderDaysBeforeDeadline: 3,
    sessionTimeoutMinutes: 60,
    analyticsEnabled: true,
    goalTemplatesEnabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if there are changes
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setState(prev => ({ ...prev, hasChanges }));
  }, [formData, originalFormData]);

  const loadSettings = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      console.log('⚙️ Loading system settings...');

      const [systemConfig, allSettings] = await Promise.all([
        settingsApi.getSystemConfig(),
        settingsApi.getAll('SYSTEM')
      ]);

      setState(prev => ({
        ...prev,
        config: systemConfig,
        allSettings,
        loading: false
      }));

      setFormData(systemConfig);
      setOriginalFormData(systemConfig);

      console.log('✅ Settings loaded successfully:', systemConfig);

    } catch (error: any) {
      console.error('❌ Error loading settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFormChange = (field: keyof SystemConfigFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateSettings = (): boolean => {
    if (!formData.organizationName.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.maxGoalsPerWeek < 1 || formData.maxGoalsPerWeek > 20) {
      toast({
        title: "Validation Error",
        description: "Maximum goals per week must be between 1 and 20",
        variant: "destructive"
      });
      return false;
    }

    if (formData.defaultGoalDuration < 1 || formData.defaultGoalDuration > 365) {
      toast({
        title: "Validation Error",
        description: "Default goal duration must be between 1 and 365 days",
        variant: "destructive"
      });
      return false;
    }

    if (formData.dataRetentionMonths < 1 || formData.dataRetentionMonths > 120) {
      toast({
        title: "Validation Error",
        description: "Data retention must be between 1 and 120 months",
        variant: "destructive"
      });
      return false;
    }

    if (formData.sessionTimeoutMinutes < 5 || formData.sessionTimeoutMinutes > 1440) {
      toast({
        title: "Validation Error",
        description: "Session timeout must be between 5 and 1440 minutes (24 hours)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) return;

    try {
      setState(prev => ({ ...prev, saving: true }));
      
      console.log('💾 Saving system settings...');

      // Update system configuration using settingsApi
      const updatedConfig = await settingsApi.updateSystemConfig(formData);
      
      setFormData(updatedConfig);
      setOriginalFormData(updatedConfig);
      
      setState(prev => ({ 
        ...prev, 
        saving: false,
        hasChanges: false,
        config: updatedConfig
      }));
      
      toast({
        title: "Settings Saved",
        description: "Your organization settings have been updated successfully.",
      });

      console.log('✅ Settings saved successfully');

    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to their original values? This cannot be undone.')) {
      setFormData(originalFormData);
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to their previous values."
      });
    }
  };

  const handleExportSettings = async () => {
    try {
      setState(prev => ({ ...prev, exporting: true }));
      
      console.log('📤 Exporting system settings...');

      const exportData = await settingsApi.exportSettings({ 
        scope: 'SYSTEM',
        format: 'json'
      });
      
      // Create download link
      const url = URL.createObjectURL(exportData);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `settings-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setState(prev => ({ ...prev, exporting: false }));
      
      toast({
        title: "Settings Exported",
        description: "System settings have been exported successfully."
      });

      console.log('✅ Settings exported successfully');

    } catch (error: any) {
      console.error('❌ Error exporting settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export settings",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, exporting: false }));
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setState(prev => ({ ...prev, importing: true }));
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        console.log('📥 Importing system settings...');
        
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file format');
        }
        
        const importedData = JSON.parse(result);
        
        // Validate imported data
        if (!importedData.settings || !Array.isArray(importedData.settings)) {
          throw new Error('Invalid settings file format');
        }
        
        // Extract settings and convert to bulk update format
        const bulkSettings: BulkUpdateSettingsDto = {
          settings: importedData.settings
            .filter(s => s.scope === 'SYSTEM' && s.key && s.value)
            .map(s => ({ key: s.key, value: s.value }))
        };
        
        if (bulkSettings.settings.length === 0) {
          throw new Error('No valid settings found in import file');
        }
        
        // Confirm import
        if (window.confirm(`Are you sure you want to import ${bulkSettings.settings.length} settings? This will override existing values.`)) {
          // Update settings
          await settingsApi.bulkUpdate(bulkSettings, 'SYSTEM');
          
          // Reload settings to refresh the form
          await loadSettings();
          
          toast({
            title: "Settings Imported",
            description: `Successfully imported ${bulkSettings.settings.length} settings.`
          });
          
          console.log('✅ Settings imported successfully');
        }
      } catch (error: any) {
        console.error('❌ Error importing settings:', error);
        toast({
          title: "Import Error",
          description: error.message || "Failed to import settings",
          variant: "destructive"
        });
      } finally {
        setState(prev => ({ ...prev, importing: false }));
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read import file",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, importing: false }));
      // Reset file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  if (state.loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Settings</h3>
            <p className="text-gray-600">Fetching your system configuration...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure your organization's settings and preferences.</p>
          </div>
          {state.hasChanges && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Organization Configuration
            </CardTitle>
            <CardDescription>Basic configuration for your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => handleFormChange('organizationName', e.target.value)}
                  placeholder="Enter organization name"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Name displayed throughout the application</p>
              </div>

              <div>
                <Label htmlFor="maxGoalsPerWeek">Maximum Goals Per Week *</Label>
                <Input
                  id="maxGoalsPerWeek"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxGoalsPerWeek}
                  onChange={(e) => handleFormChange('maxGoalsPerWeek', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum number of goals a volunteer can create per week</p>
              </div>

              <div>
                <Label htmlFor="defaultGoalDuration">Default Goal Duration (days) *</Label>
                <Input
                  id="defaultGoalDuration"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.defaultGoalDuration}
                  onChange={(e) => handleFormChange('defaultGoalDuration', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Default duration for new goals in days</p>
              </div>

              <div>
                <Label htmlFor="reminderDays">Reminder Days Before Deadline *</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminderDaysBeforeDeadline}
                  onChange={(e) => handleFormChange('reminderDaysBeforeDeadline', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Days before deadline to send reminder notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Features & Notifications
            </CardTitle>
            <CardDescription>Configure system features and notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Enable email notifications system-wide</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotificationsEnabled}
                    onCheckedChange={(checked) => handleFormChange('emailNotificationsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsEnabled">Analytics</Label>
                    <p className="text-sm text-gray-500">Enable analytics and reporting features</p>
                  </div>
                  <Switch
                    id="analyticsEnabled"
                    checked={formData.analyticsEnabled}
                    onCheckedChange={(checked) => handleFormChange('analyticsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="goalTemplatesEnabled">Goal Templates</Label>
                    <p className="text-sm text-gray-500">Enable goal templates feature</p>
                  </div>
                  <Switch
                    id="goalTemplatesEnabled"
                    checked={formData.goalTemplatesEnabled}
                    onCheckedChange={(checked) => handleFormChange('goalTemplatesEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Data
            </CardTitle>
            <CardDescription>Configure security and data retention settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes) *</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => handleFormChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">User session timeout in minutes (5-1440)</p>
              </div>

              <div>
                <Label htmlFor="dataRetention">Data Retention (months) *</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.dataRetentionMonths}
                  onChange={(e) => handleFormChange('dataRetentionMonths', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Number of months to retain goal and progress data</p>
              </div>

              <div>
                <Label htmlFor="backupFrequency">Backup Frequency (hours) *</Label>
                <Input
                  id="backupFrequency"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.backupFrequencyHours}
                  onChange={(e) => handleFormChange('backupFrequencyHours', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Automatic backup frequency in hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Import and export system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Button */}
              <Button 
                onClick={handleExportSettings} 
                className="h-auto p-4 justify-start" 
                variant="outline"
                disabled={state.exporting}
              >
                <div className="flex items-center gap-3">
                  {state.exporting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="h-5 w-5 text-blue-600" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">Export Settings</p>
                    <p className="text-sm text-gray-500">Download system settings as JSON</p>
                  </div>
                </div>
              </Button>
              
              {/* Import Button */}
              <div className="relative">
                <Button 
                  onClick={() => document.getElementById('import-settings')?.click()}
                  className="h-auto p-4 justify-start w-full" 
                  variant="outline"
                  disabled={state.importing}
                >
                  <div className="flex items-center gap-3">
                    {state.importing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Upload className="h-5 w-5 text-green-600" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">Import Settings</p>
                      <p className="text-sm text-gray-500">Upload settings from JSON file</p>
                    </div>
                  </div>
                </Button>
                <input
                  type="file"
                  id="import-settings"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="absolute opacity-0 w-0 h-0"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Data Management Caution</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Importing settings will override existing values. Always export your current settings as a backup before importing new ones.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button 
                onClick={handleResetSettings}
                variant="outline"
                className="px-8"
                disabled={!state.hasChanges || state.saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
              <Button 
                onClick={handleSaveSettings} 
                className="px-8"
                disabled={!state.hasChanges || state.saving}
              >
                {state.saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;