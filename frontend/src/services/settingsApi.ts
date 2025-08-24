import httpClient from './httpClient';

// Backend DTO interfaces matching the settings controller
export interface SettingResponseDto {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  scope: 'SYSTEM' | 'USER';
  userId?: string;
  description?: string;
  editable: boolean;
  allowedValues?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  scope?: 'SYSTEM' | 'USER';
  description?: string;
  editable?: boolean;
  allowedValues?: string[];
}

export interface UpdateSettingDto {
  value: string;
  description?: string;
  editable?: boolean;
  allowedValues?: string[];
}

export interface BulkUpdateSettingsDto {
  settings: Array<{
    key: string;
    value: string;
  }>;
}

export interface SystemConfigDto {
  organizationName: string;
  maxGoalsPerWeek: number;
  defaultGoalDuration: number;
  dataRetentionMonths: number;
  backupFrequencyHours: number;
  emailNotificationsEnabled: boolean;
  reminderDaysBeforeDeadline: number;
  sessionTimeoutMinutes: number;
  analyticsEnabled: boolean;
  goalTemplatesEnabled: boolean;
}

export interface UserPreferencesDto {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  emailNotifications: boolean;
  weeklyReports: boolean;
  dashboardRefreshInterval: number;
}

export interface ExportSettingsDto {
  scope?: 'SYSTEM' | 'USER';
  format?: 'json' | 'csv';
}

class SettingsApiService {
  private isOnline = false;
  private baseURL = '/settings';

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await httpClient.get(`${this.baseURL}/system/config`);
      this.isOnline = true;
      console.log('✅ Settings API connected to backend');
    } catch (error) {
      this.isOnline = false;
      console.log('🔄 Settings API using fallback mode');
    }
  }

  // SYSTEM SETTINGS MANAGEMENT

  /**
   * Get all settings with optional filtering
   */
  async getAll(scope?: 'SYSTEM' | 'USER', userId?: string): Promise<SettingResponseDto[]> {
    if (this.isOnline) {
      try {
        console.log(`⚙️ Getting ${scope || 'all'} settings...`);
        
        const params = new URLSearchParams();
        if (scope) params.append('scope', scope.toLowerCase());
        if (userId) params.append('userId', userId);

        const response = await httpClient.get<SettingResponseDto[]>(`${this.baseURL}?${params.toString()}`);
        
        console.log(`✅ Settings loaded successfully (${response.length} items)`);
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getAllSettingsFallback(scope);
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(): Promise<SystemConfigDto> {
    if (this.isOnline) {
      try {
        console.log('⚙️ Getting system configuration...');
        
        const response = await httpClient.get<SystemConfigDto>(`${this.baseURL}/system/config`);
        
        console.log('✅ System configuration loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getSystemConfigFallback();
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesDto> {
    if (this.isOnline) {
      try {
        console.log(`👤 Getting user preferences for ${userId}...`);
        
        const response = await httpClient.get<UserPreferencesDto>(`${this.baseURL}/user/${userId}/preferences`);
        
        console.log('✅ User preferences loaded successfully');
        return response;
      } catch (error: any) {
        console.warn('Backend failed, using fallback data');
      }
    }

    // Fallback
    return this.getUserPreferencesFallback(userId);
  }

  /**
   * Get specific setting by key and scope
   */
  async getByKey(key: string, scope: 'SYSTEM' | 'USER' = 'SYSTEM', userId?: string): Promise<SettingResponseDto> {
    if (this.isOnline) {
      try {
        console.log(`🔍 Getting setting: ${scope}/${key}`);
        
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);

        const response = await httpClient.get<SettingResponseDto>(
          `${this.baseURL}/${scope}/${key}?${params.toString()}`
        );
        
        console.log('✅ Setting retrieved successfully');
        return response;
      } catch (error: any) {
        throw this.transformError(error);
      }
    }

    // Fallback
    throw new Error('Setting not found in offline mode');
  }

  /**
   * Create a new setting
   */
  async create(createDto: CreateSettingDto): Promise<SettingResponseDto> {
    if (this.isOnline) {
      try {
        console.log('✨ Creating new setting:', createDto.key);
        
        const response = await httpClient.post<SettingResponseDto>(this.baseURL, createDto);
        
        console.log('✅ Setting created successfully');
        return response;
      } catch (error: any) {
        throw this.transformError(error);
      }
    }

    throw new Error('Cannot create settings in offline mode');
  }

  /**
   * Update a specific setting
   */
  async update(
    key: string, 
    updateDto: UpdateSettingDto, 
    scope: 'SYSTEM' | 'USER' = 'SYSTEM', 
    userId?: string
  ): Promise<SettingResponseDto> {
    if (this.isOnline) {
      try {
        console.log(`📝 Updating setting: ${scope}/${key}`);
        
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);

        const response = await httpClient.put<SettingResponseDto>(
          `${this.baseURL}/${scope}/${key}?${params.toString()}`,
          updateDto
        );
        
        console.log('✅ Setting updated successfully');
        return response;
      } catch (error: any) {
        throw this.transformError(error);
      }
    }

    // Fallback for system settings
    if (scope === 'SYSTEM') {
      return this.updateSystemSettingFallback(key, updateDto.value);
    }

    throw new Error('Cannot update settings in offline mode');
  }

  /**
   * Bulk update settings
   */
  async bulkUpdate(
    bulkUpdateDto: BulkUpdateSettingsDto, 
    scope: 'SYSTEM' | 'USER' = 'SYSTEM', 
    userId?: string
  ): Promise<SettingResponseDto[]> {
    if (this.isOnline) {
      try {
        console.log(`📦 Bulk updating ${bulkUpdateDto.settings.length} settings...`);
        
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);

        const response = await httpClient.put<SettingResponseDto[]>(
          `${this.baseURL}/bulk/${scope}?${params.toString()}`,
          bulkUpdateDto
        );
        
        console.log('✅ Bulk update completed successfully');
        return response;
      } catch (error: any) {
        throw this.transformError(error);
      }
    }

    // Fallback for system settings
    if (scope === 'SYSTEM') {
      return this.bulkUpdateSystemSettingsFallback(bulkUpdateDto);
    }

    throw new Error('Cannot bulk update settings in offline mode');
  }

  /**
   * Delete a setting
   */
  async delete(key: string, scope: 'SYSTEM' | 'USER' = 'SYSTEM', userId?: string): Promise<void> {
    if (this.isOnline) {
      try {
        console.log(`🗑️ Deleting setting: ${scope}/${key}`);
        
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);

        await httpClient.delete(`${this.baseURL}/${scope}/${key}?${params.toString()}`);
        
        console.log('✅ Setting deleted successfully');
      } catch (error: any) {
        throw this.transformError(error);
      }
    } else {
      throw new Error('Cannot delete settings in offline mode');
    }
  }

  /**
   * Export settings
   */
  async exportSettings(exportDto: ExportSettingsDto = {}): Promise<Blob> {
    if (this.isOnline) {
      try {
        console.log('📤 Exporting settings...');
        
        const params = new URLSearchParams();
        if (exportDto.scope) params.append('scope', exportDto.scope.toLowerCase());
        if (exportDto.format) params.append('format', exportDto.format);

        const response = await httpClient.get(`${this.baseURL}/export?${params.toString()}`, {
          responseType: 'blob'
        });
        
        console.log('✅ Settings exported successfully');
        return response as Blob;
      } catch (error: any) {
        throw this.transformError(error);
      }
    }

    // Fallback export
    return this.exportSettingsFallback(exportDto);
  }

  // CONVENIENCE METHODS FOR COMMON OPERATIONS

  /**
   * Update system configuration (convenience method)
   */
  async updateSystemConfig(config: Partial<SystemConfigDto>): Promise<SystemConfigDto> {
    const settings = this.transformConfigToSettings(config);
    
    await this.bulkUpdate({ settings }, 'SYSTEM');
    
    // Return updated configuration
    return this.getSystemConfig();
  }

  /**
   * Update user preferences (convenience method)
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferencesDto>): Promise<UserPreferencesDto> {
    const settings = this.transformPreferencesToSettings(preferences);
    
    await this.bulkUpdate({ settings }, 'USER', userId);
    
    // Return updated preferences
    return this.getUserPreferences(userId);
  }

  // PRIVATE UTILITY METHODS

  private transformConfigToSettings(config: Partial<SystemConfigDto>): Array<{ key: string; value: string }> {
    const settings: Array<{ key: string; value: string }> = [];

    if (config.organizationName !== undefined) {
      settings.push({ key: 'organization.name', value: config.organizationName });
    }
    if (config.maxGoalsPerWeek !== undefined) {
      settings.push({ key: 'goals.max_per_week', value: config.maxGoalsPerWeek.toString() });
    }
    if (config.defaultGoalDuration !== undefined) {
      settings.push({ key: 'goals.default_duration_days', value: config.defaultGoalDuration.toString() });
    }
    if (config.dataRetentionMonths !== undefined) {
      settings.push({ key: 'data.retention_months', value: config.dataRetentionMonths.toString() });
    }
    if (config.backupFrequencyHours !== undefined) {
      settings.push({ key: 'backup.frequency_hours', value: config.backupFrequencyHours.toString() });
    }
    if (config.emailNotificationsEnabled !== undefined) {
      settings.push({ key: 'notifications.email_enabled', value: config.emailNotificationsEnabled.toString() });
    }
    if (config.reminderDaysBeforeDeadline !== undefined) {
      settings.push({ key: 'notifications.reminder_days_before', value: config.reminderDaysBeforeDeadline.toString() });
    }
    if (config.sessionTimeoutMinutes !== undefined) {
      settings.push({ key: 'security.session_timeout_minutes', value: config.sessionTimeoutMinutes.toString() });
    }
    if (config.analyticsEnabled !== undefined) {
      settings.push({ key: 'features.analytics_enabled', value: config.analyticsEnabled.toString() });
    }
    if (config.goalTemplatesEnabled !== undefined) {
      settings.push({ key: 'features.goal_templates_enabled', value: config.goalTemplatesEnabled.toString() });
    }

    return settings;
  }

  private transformPreferencesToSettings(preferences: Partial<UserPreferencesDto>): Array<{ key: string; value: string }> {
    const settings: Array<{ key: string; value: string }> = [];

    if (preferences.theme !== undefined) {
      settings.push({ key: 'user.theme', value: preferences.theme });
    }
    if (preferences.timezone !== undefined) {
      settings.push({ key: 'user.timezone', value: preferences.timezone });
    }
    if (preferences.emailNotifications !== undefined) {
      settings.push({ key: 'user.email_notifications', value: preferences.emailNotifications.toString() });
    }
    if (preferences.weeklyReports !== undefined) {
      settings.push({ key: 'user.weekly_reports', value: preferences.weeklyReports.toString() });
    }
    if (preferences.dashboardRefreshInterval !== undefined) {
      settings.push({ key: 'user.dashboard_refresh_interval', value: preferences.dashboardRefreshInterval.toString() });
    }

    return settings;
  }

  // FALLBACK METHODS

  private async getAllSettingsFallback(scope?: 'SYSTEM' | 'USER'): Promise<SettingResponseDto[]> {
    const stored = localStorage.getItem('settings');
    if (stored) {
      const allSettings = JSON.parse(stored);
      return scope ? allSettings.filter((s: SettingResponseDto) => s.scope === scope) : allSettings;
    }

    // Generate default settings
    const defaultSettings = this.getDefaultSettings();
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
    
    return scope ? defaultSettings.filter(s => s.scope === scope) : defaultSettings;
  }

  private async getSystemConfigFallback(): Promise<SystemConfigDto> {
    const stored = localStorage.getItem('systemConfig');
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultConfig: SystemConfigDto = {
      organizationName: 'X3 Lab',
      maxGoalsPerWeek: 5,
      defaultGoalDuration: 7,
      dataRetentionMonths: 12,
      backupFrequencyHours: 24,
      emailNotificationsEnabled: true,
      reminderDaysBeforeDeadline: 3,
      sessionTimeoutMinutes: 60,
      analyticsEnabled: true,
      goalTemplatesEnabled: true
    };

    localStorage.setItem('systemConfig', JSON.stringify(defaultConfig));
    return defaultConfig;
  }

  private async getUserPreferencesFallback(userId: string): Promise<UserPreferencesDto> {
    const stored = localStorage.getItem(`userPreferences_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultPreferences: UserPreferencesDto = {
      theme: 'light',
      timezone: 'America/New_York',
      emailNotifications: true,
      weeklyReports: true,
      dashboardRefreshInterval: 300
    };

    localStorage.setItem(`userPreferences_${userId}`, JSON.stringify(defaultPreferences));
    return defaultPreferences;
  }

  private async updateSystemSettingFallback(key: string, value: string): Promise<SettingResponseDto> {
    const config = await this.getSystemConfigFallback();
    
    // Update the relevant configuration
    const keyMap: Record<string, keyof SystemConfigDto> = {
      'organization.name': 'organizationName',
      'goals.max_per_week': 'maxGoalsPerWeek',
      'goals.default_duration_days': 'defaultGoalDuration',
      'data.retention_months': 'dataRetentionMonths',
      'backup.frequency_hours': 'backupFrequencyHours',
      'notifications.email_enabled': 'emailNotificationsEnabled',
      'notifications.reminder_days_before': 'reminderDaysBeforeDeadline',
      'security.session_timeout_minutes': 'sessionTimeoutMinutes',
      'features.analytics_enabled': 'analyticsEnabled',
      'features.goal_templates_enabled': 'goalTemplatesEnabled'
    };

    const configKey = keyMap[key];
    if (configKey) {
      (config as any)[configKey] = this.parseValue(value, this.getSettingType(key));
      localStorage.setItem('systemConfig', JSON.stringify(config));
    }

    return {
      id: `setting-${key}`,
      key,
      value,
      type: this.getSettingType(key),
      scope: 'SYSTEM',
      description: this.getSettingDescription(key),
      editable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async bulkUpdateSystemSettingsFallback(bulkUpdateDto: BulkUpdateSettingsDto): Promise<SettingResponseDto[]> {
    const results: SettingResponseDto[] = [];
    
    for (const setting of bulkUpdateDto.settings) {
      try {
        const result = await this.updateSystemSettingFallback(setting.key, setting.value);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update setting ${setting.key}:`, error);
      }
    }
    
    return results;
  }

  private async exportSettingsFallback(exportDto: ExportSettingsDto): Promise<Blob> {
    const settings = await this.getAllSettingsFallback(exportDto.scope);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      scope: exportDto.scope || 'ALL',
      settings: settings
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  private getDefaultSettings(): SettingResponseDto[] {
    const now = new Date().toISOString();
    
    return [
      {
        id: 'setting-org-name',
        key: 'organization.name',
        value: 'X3 Lab',
        type: 'STRING',
        scope: 'SYSTEM',
        description: 'Organization name displayed throughout the application',
        editable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'setting-max-goals',
        key: 'goals.max_per_week',
        value: '5',
        type: 'NUMBER',
        scope: 'SYSTEM',
        description: 'Maximum number of goals a volunteer can create per week',
        editable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'setting-default-duration',
        key: 'goals.default_duration_days',
        value: '7',
        type: 'NUMBER',
        scope: 'SYSTEM',
        description: 'Default duration for new goals in days',
        editable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'setting-retention',
        key: 'data.retention_months',
        value: '12',
        type: 'NUMBER',
        scope: 'SYSTEM',
        description: 'Number of months to retain goal and progress data',
        editable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'setting-backup-freq',
        key: 'backup.frequency_hours',
        value: '24',
        type: 'NUMBER',
        scope: 'SYSTEM',
        description: 'Backup frequency in hours',
        editable: true,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private getSettingType(key: string): 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' {
    if (key.includes('enabled') || key.includes('email_notifications') || key.includes('weekly_reports')) {
      return 'BOOLEAN';
    }
    if (key.includes('max_') || key.includes('duration') || key.includes('retention') || key.includes('frequency') || key.includes('timeout')) {
      return 'NUMBER';
    }
    return 'STRING';
  }

  private getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'organization.name': 'Organization name displayed throughout the application',
      'goals.max_per_week': 'Maximum number of goals a volunteer can create per week',
      'goals.default_duration_days': 'Default duration for new goals in days',
      'data.retention_months': 'Number of months to retain goal and progress data',
      'backup.frequency_hours': 'Backup frequency in hours',
      'notifications.email_enabled': 'Enable email notifications system-wide',
      'notifications.reminder_days_before': 'Days before deadline to send reminder notifications',
      'security.session_timeout_minutes': 'User session timeout in minutes',
      'features.analytics_enabled': 'Enable analytics and reporting features',
      'features.goal_templates_enabled': 'Enable goal templates feature'
    };

    return descriptions[key] || 'System setting';
  }

  private parseValue(value: string, type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'): any {
    switch (type) {
      case 'NUMBER':
        return parseFloat(value);
      case 'BOOLEAN':
        return value.toLowerCase() === 'true';
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private transformError(error: any): Error {
    if (error.status === 403) {
      return new Error('Access denied. Admin privileges required for this setting.');
    } else if (error.status === 404) {
      return new Error('Setting not found');
    } else if (error.status === 422) {
      return new Error(error.message || 'Invalid setting value provided');
    } else if (error.status >= 500) {
      return new Error('Server error. Please try again later.');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  // Development/Debug methods
  getDebugInfo(): object {
    return {
      serviceReady: true,
      isOnline: this.isOnline,
      endpoints: {
        base: this.baseURL,
        systemConfig: `${this.baseURL}/system/config`,
        userPreferences: `${this.baseURL}/user/:userId/preferences`,
        export: `${this.baseURL}/export`,
        bulkUpdate: `${this.baseURL}/bulk/:scope`
      },
      features: [
        'System configuration management',
        'User preferences management', 
        'Bulk settings operations',
        'Settings export/import',
        'Real-time settings updates',
        'Comprehensive fallback system'
      ]
    };
  }
}

export const settingsApi = new SettingsApiService();
export default settingsApi;