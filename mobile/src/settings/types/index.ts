export interface SettingsToggle {
  id: string;
  label: string;
  icon: string;
  value: boolean;
  description?: string;
  onChange: (value: boolean) => void;
}

export interface SettingsItem {
  id: string;
  label: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'select' | 'slider' | 'info';
  value?: any;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  visible?: boolean;
  onPress?: () => void;
  onChange?: (value: any) => void;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
  footer?: string;
}

export interface UserPreferences {
  // Interface & Theme
  darkMode: boolean;
  theme: 'light' | 'dark' | 'system';
  textSize: number;
  layoutDensity: 'compact' | 'comfortable';
  hapticFeedback: boolean;
  animations: boolean;
  
  // Notifications
  notifications: boolean;
  pushNotifications: boolean;
  tuneUpdates: boolean;
  communityNotifications: boolean;
  marketingEmails: boolean;
  
  // Performance & AI
  aiRecommendations: boolean;
  performanceLevel: 'conservative' | 'balanced' | 'aggressive';
  safetyTolerance: 'maximum' | 'high' | 'standard';
  autoUpdateTunes: boolean;
  
  // Data & Privacy
  privacyMode: boolean;
  locationAccess: boolean;
  analytics: boolean;
  crashReporting: boolean;
  aiTrainingData: boolean;
  
  // Data & Sync
  autoDownload: boolean;
  cloudSync: boolean;
  offlineMode: boolean;
  autoBackup: boolean;
  
  // Localization
  language: string;
  timezone: string;
  units: 'metric' | 'imperial' | 'mixed';
  
  // Advanced
  developerMode: boolean;
}

export interface AccountInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  createdAt?: string;
  lastLogin?: string;
  twoFactorEnabled: boolean;
  connectedServices: string[];
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  releaseDate: string;
  platform: string;
  deviceInfo: {
    model: string;
    os: string;
    osVersion: string;
  };
} 