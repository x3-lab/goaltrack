
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '../contexts/AppStateContext';

export const ConnectionStatus: React.FC = () => {
  const { state, actions } = useAppState();
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      actions.setOnline(isOnline);
      
      if (isOnline) {
        // Test connection quality
        const startTime = Date.now();
        fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
          .then(() => {
            const responseTime = Date.now() - startTime;
            setConnectionQuality(responseTime < 1000 ? 'good' : 'poor');
          })
          .catch(() => {
            setConnectionQuality('poor');
          });
      } else {
        setConnectionQuality('offline');
      }
    };

    // Initial check
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Periodic check every 30 seconds
    const interval = setInterval(updateOnlineStatus, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [actions]);

  const getStatusIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (connectionQuality) {
      case 'good':
        return 'Online';
      case 'poor':
        return 'Poor Connection';
      case 'offline':
        return 'Offline';
    }
  };

  const getStatusColor = () => {
    switch (connectionQuality) {
      case 'good':
        return 'text-green-600';
      case 'poor':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
    }
  };

  return (
    <div 
      className="flex items-center space-x-2"
      data-testid="connection-status"
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${getStatusText()}`}
    >
      {getStatusIcon()}
      <span className={cn('text-sm font-medium', getStatusColor())}>
        {getStatusText()}
      </span>
      {state.ui.lastSync && (
        <span className="text-xs text-gray-500">
          Last sync: {new Date(state.ui.lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};