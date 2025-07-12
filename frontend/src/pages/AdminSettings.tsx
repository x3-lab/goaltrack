
import React, { useState } from 'react';
import { Settings, Save, Download, Upload, Mail, Bell, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/seperator';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    organizationName: 'X3 Lab',
    emailNotifications: true,
    weeklyReports: true,
    autoReminders: true,
    dataRetention: '12',
    maxGoalsPerWeek: '5',
    defaultGoalDuration: '7'
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving settings:', settings);
      toast({
        title: "Settings Saved",
        description: "Your organization settings have been updated successfully.",
      });
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
    try {
      console.log('Exporting data...');
      toast({
        title: "Export Started",
        description: "Your data export is being prepared. You'll receive a download link shortly.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = async () => {
    try {
      console.log('Importing data...');
      toast({
        title: "Import Ready",
        description: "Please select the file you want to import.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive"
      });
    }
  };

  const handleSendReport = async () => {
    try {
      toast({
        title: "Report Sent",
        description: "Performance report has been sent to all administrators.",
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure your organization's settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Organization Settings</span>
            </CardTitle>
            <CardDescription>Basic configuration for your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={settings.organizationName}
                onChange={(e) => handleSettingChange('organizationName', e.target.value)}
                aria-describedby="orgName-help"
              />
              <p id="orgName-help" className="text-sm text-gray-500">
                This name will appear in reports and notifications
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxGoals">Maximum Goals Per Week</Label>
              <Input
                id="maxGoals"
                type="number"
                min="1"
                max="20"
                value={settings.maxGoalsPerWeek}
                onChange={(e) => handleSettingChange('maxGoalsPerWeek', e.target.value)}
                aria-describedby="maxGoals-help"
              />
              <p id="maxGoals-help" className="text-sm text-gray-500">
                Limit the number of goals volunteers can create per week
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalDuration">Default Goal Duration (days)</Label>
              <Input
                id="goalDuration"
                type="number"
                min="1"
                max="365"
                value={settings.defaultGoalDuration}
                onChange={(e) => handleSettingChange('defaultGoalDuration', e.target.value)}
                aria-describedby="goalDuration-help"
              />
              <p id="goalDuration-help" className="text-sm text-gray-500">
                Default timeframe for new goals
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Data Retention Period (months)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="120"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                aria-describedby="retention-help"
              />
              <p id="retention-help" className="text-sm text-gray-500">
                How long to keep goal and performance data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Configure email and system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Send email notifications for important events</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                aria-label="Toggle email notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-gray-500">Automatically generate weekly performance reports</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                aria-label="Toggle weekly reports"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Reminders</Label>
                <p className="text-sm text-gray-500">Send automatic reminders for upcoming deadlines</p>
              </div>
              <Switch
                checked={settings.autoReminders}
                onCheckedChange={(checked) => handleSettingChange('autoReminders', checked)}
                aria-label="Toggle auto reminders"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>Export and import system data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleExportData} 
              className="h-auto p-4" 
              variant="outline"
              aria-label="Export all system data"
            >
              <Download className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-500">Download all system data</p>
              </div>
            </Button>
            
            <Button 
              onClick={handleImportData} 
              className="h-auto p-4" 
              variant="outline"
              aria-label="Import data from backup"
            >
              <Upload className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Import Data</p>
                <p className="text-sm text-gray-500">Upload data from backup</p>
              </div>
            </Button>

            <Button 
              onClick={handleSendReport}
              className="h-auto p-4" 
              variant="outline"
              aria-label="Send performance report via email"
            >
              <Mail className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Send Report</p>
                <p className="text-sm text-gray-500">Email performance report</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          className="px-8"
          aria-label="Save all settings"
        >
          {loading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;