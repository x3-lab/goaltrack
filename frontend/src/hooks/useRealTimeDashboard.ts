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

  // Use refs for stable callback references
  const onErrorRef = useRef(onError);
  const onUpdateRef = useRef(onUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

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
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isAutoRefreshEnabledRef = useRef(enableAutoRefresh);

  // Update auto-refresh enabled ref when it changes
  useEffect(() => {
    isAutoRefreshEnabledRef.current = enableAutoRefresh;
  }, [enableAutoRefresh]);

  const updateOnlineStatus = useCallback(() => {
    setData(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  // Set up online/offline listeners once
  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []); // Empty dependency array - this should only run once

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
      retryCountRef.current = 0; // Reset retry count on success

      // Call update callback using ref
      if (onUpdateRef.current) {
        onUpdateRef.current(newData);
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

      // Call error callback using ref
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }

      // Implement exponential backoff for retries
      if (isAutoRefresh && retryCountRef.current < maxRetries) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s

        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          fetchDashboardData(true);
        }, retryDelay);
      }
    }
  }, []); // Empty dependency array - all dependencies are now refs

  const startAutoRefresh = useCallback(() => {
    if (!isAutoRefreshEnabledRef.current) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        fetchDashboardData(true);
      }
    }, refreshInterval);

    console.log(`🔄 Auto-refresh started (interval: ${refreshInterval / 1000}s)`);
  }, [refreshInterval, fetchDashboardData]);

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

  // Initialize data fetch once on mount
  useEffect(() => {
    fetchDashboardData(false);
  }, []); // Only run once on mount

  // Handle auto-refresh setup
  useEffect(() => {
    if (enableAutoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enableAutoRefresh, refreshInterval]); // Only depend on the actual config values

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnlineChange = () => {
      if (navigator.onLine && isAutoRefreshEnabledRef.current) {
        // Restart auto-refresh when coming back online
        startAutoRefresh();
      } else if (!navigator.onLine) {
        // Stop auto-refresh when going offline
        stopAutoRefresh();
      }
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, [startAutoRefresh, stopAutoRefresh]);

  return {
    data,
    refresh: manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshEnabled: enableAutoRefresh && !!intervalRef.current
  };
};

export default useRealTimeDashboard;