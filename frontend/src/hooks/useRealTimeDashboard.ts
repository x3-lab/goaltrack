import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, type DashboardStatsDto, type ActivityDto, type DeadlineDto } from '../services/adminApi';

export interface RealTimeDashboardData {
  stats: DashboardStatsDto | null;
  recentActivity: ActivityDto[];
  upcomingDeadlines: DeadlineDto[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOnline: boolean;
}

interface UseRealTimeDashboardOptions {
  refreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
  onError?: (error: Error) => void;
  onUpdate?: (data: RealTimeDashboardData) => void;
}

export const useRealTimeDashboard = (options: UseRealTimeDashboardOptions = {}) => {
  const {
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    enableAutoRefresh = true,
    onError,
    onUpdate
  } = options;

  const [data, setData] = useState<RealTimeDashboardData>({
    stats: null,
    recentActivity: [],
    upcomingDeadlines: [],
    loading: true,
    error: null,
    lastUpdated: null,
    isOnline: navigator.onLine
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const updateOnlineStatus = useCallback(() => {
    setData(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  const fetchDashboardData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setData(prev => ({ ...prev, loading: true, error: null }));
      }

      console.log('📊 Fetching real-time dashboard data...');

      const [stats, recentActivity, upcomingDeadlines] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivity(15),
        adminApi.getUpcomingDeadlines(10)
      ]);

      const newData: RealTimeDashboardData = {
        stats,
        recentActivity,
        upcomingDeadlines,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isOnline: navigator.onLine
      };

      setData(newData);
      setRetryCount(0); // Reset retry count on success

      // Call update callback
      if (onUpdate) {
        onUpdate(newData);
      }

      console.log('✅ Real-time dashboard data updated successfully');

    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      
      const errorMessage = error.message || 'Failed to fetch dashboard data';
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      // Call error callback
      if (onError) {
        onError(error);
      }

      // Implement exponential backoff for retries
      if (isAutoRefresh && retryCount < maxRetries) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchDashboardData(true);
        }, retryDelay);
      }
    }
  }, [onError, onUpdate, retryCount]);

  const startAutoRefresh = useCallback(() => {
    if (!enableAutoRefresh) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(() => {
      if (navigator.onLine && !data.loading) {
        fetchDashboardData(true);
      }
    }, refreshInterval);

    console.log(`🔄 Auto-refresh started (interval: ${refreshInterval / 1000}s)`);
  }, [enableAutoRefresh, refreshInterval, fetchDashboardData, data.loading]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    await fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Initialize data fetch and auto-refresh
  useEffect(() => {
    fetchDashboardData(false);
    
    if (enableAutoRefresh) {
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enableAutoRefresh, startAutoRefresh, stopAutoRefresh]);

  // Restart auto-refresh when coming back online
  useEffect(() => {
    if (data.isOnline && enableAutoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }, [data.isOnline, enableAutoRefresh, startAutoRefresh, stopAutoRefresh]);

  return {
    data,
    refresh: manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshEnabled: enableAutoRefresh && !!intervalRef.current
  };
};

export default useRealTimeDashboard;