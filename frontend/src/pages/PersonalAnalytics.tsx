import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '../services/analyticsApi';
import PersonalAnalytics from '../components/PersonalAnalytics';
import type { PersonalAnalyticsDto } from '../types/analytics';

const PersonalAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<PersonalAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load analytics data from API
  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
    }
  }, [user?.id]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading personal analytics for user:', user.id);
      
      const data = await analyticsApi.getPersonalAnalytics({ 
        volunteerId: user.id 
      });
      
      setAnalyticsData(data);
      console.log('✅ Personal analytics loaded successfully');
    } catch (err: any) {
      console.error('❌ Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    if (!user?.id || !analyticsData) return;
    
    setExporting(true);
    try {
      const reportData = await analyticsApi.exportReport({
        type: 'overview',
        filters: { volunteerId: user.id }
      });

      // Create export data specifically for personal analytics
      const exportData = {
        exportDate: new Date().toISOString(),
        volunteerId: user.id,
        volunteerName: user.name,
        analytics: analyticsData,
        summary: {
          overallCompletionRate: analyticsData.overallCompletionRate,
          performanceScore: analyticsData.performanceScore,
          streakCount: analyticsData.streakCount,
          achievementsCount: analyticsData.achievements.length,
          categoriesCount: analyticsData.categoryStats.length
        }
      };

      // Create and download the report
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-analytics-${user.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your personal analytics report has been downloaded.",
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export your analytics",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
            <p className="text-gray-600 mt-1">Loading your performance metrics...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading your analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No analytics data available</p>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
            <p className="text-gray-600 mt-1">
              View your performance metrics and track your progress over time.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            {refreshing ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
          
          <Button onClick={handleExport} variant="outline" size="sm" disabled={exporting}>
            {exporting ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      <PersonalAnalytics 
        data={analyticsData} 
        onRefresh={handleRefresh}
        volunteerId={user?.id}
      />

      {/* Export indicator */}
      {exporting && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Exporting your analytics...</span>
        </div>
      )}
    </div>
  );
};

export default PersonalAnalyticsPage;