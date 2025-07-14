import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Upload, Mail, Bell, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/seperator';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  organizationName: string;
  dataRetention: string;
  maxGoalsPerWeek: string;
  defaultGoalDuration: string;
  backupFrequency: string;
}

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    organizationName: 'X3 Lab',
    dataRetention: '12',
    maxGoalsPerWeek: '5',
    defaultGoalDuration: '7',
    backupFrequency: '24',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call to load settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: This should fetch from API
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const validateSettings = (): boolean => {
    if (!settings.organizationName.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive"
      });
      return false;
    }

    if (parseInt(settings.maxGoalsPerWeek) < 1 || parseInt(settings.maxGoalsPerWeek) > 20) {
      toast({
        title: "Validation Error",
        description: "Maximum goals per week must be between 1 and 20",
        variant: "destructive"
      });
      return false;
    }

    if (parseInt(settings.defaultGoalDuration) < 1 || parseInt(settings.defaultGoalDuration) > 365) {
      toast({
        title: "Validation Error",
        description: "Default goal duration must be between 1 and 365 days",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: This should save to API
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Your organization settings have been updated successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a sample export file
      const exportData = {
        settings,
        exportDate: new Date().toISOString(),
        volunteers: [],
        goals: [],
        analytics: {}
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goaltrack-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      organizationName: 'X3 Lab',
      dataRetention: '12',
      maxGoalsPerWeek: '5',
      defaultGoalDuration: '7',
      backupFrequency: '24',
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your organization's settings and preferences.</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">You have unsaved changes</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{settings.organizationName} Settings</span>
            </CardTitle>
            <CardDescription>Basic configuration for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-2">
                <Label htmlFor="maxGoals">Maximum Goals Per Week *</Label>
                <Input
                  id="maxGoals"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxGoalsPerWeek}
                  onChange={(e) => handleSettingChange('maxGoalsPerWeek', e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Limit the number of goals volunteers can create per week
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalDuration">Default Goal Duration (days) *</Label>
                <Input
                  id="goalDuration"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.defaultGoalDuration}
                  onChange={(e) => handleSettingChange('defaultGoalDuration', e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Default timeframe for new goals
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention Period (months) *</Label>
                <Input
                  id="retention"
                  type="number"
                  min="1"
                  max="120"
                  value={settings.dataRetention}
                  onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  How long to keep goal and performance data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>Export, import, and manage system data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                onClick={handleExportData} 
                className="h-auto p-4 justify-start" 
                variant="outline"
                disabled={exportLoading}
              >
                <div className="flex items-center space-x-3">
                  {exportLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="h-5 w-5 text-blue-600" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">Export Data</p>
                    <p className="text-sm text-gray-500">Download all system data</p>
                  </div>
                </div>
              </Button>
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button 
              onClick={handleResetSettings}
              variant="outline"
              className="px-8"
            >
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSaveSettings} 
              disabled={loading || !hasChanges}
              className="px-8"
            >
              {loading ? (
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
  );
};

export default AdminSettings;