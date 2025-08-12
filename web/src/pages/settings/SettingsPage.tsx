import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Main Settings Page - World-class settings hub with comprehensive user controls
interface UserPreferences {
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

interface SettingsItem {
  id: string;
  label: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'select' | 'info';
  value?: any;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  onChange?: (value: any) => void;
  options?: Array<{ label: string; value: any }>;
}

interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  items: SettingsItem[];
  footer?: string;
}

interface AppInfo {
  version: string;
  buildNumber: string;
  platform: string;
  deviceInfo: {
    browser: string;
    os: string;
    screen: string;
  };
}

// Helper functions
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const getIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    'account-circle': '👤',
    'garage': '🏠',
    'tune': '🔧',
    'credit-card': '💳',
    'shield': '🛡️',
    'notifications': '🔔',
    'palette': '🎨',
    'speed': '⚡',
    'privacy': '🔒',
    'cloud': '☁️',
    'globe': '🌍',
    'code': '⚙️',
    'help': '❓',
    'info': 'ℹ️',
    'legal': '📄',
    'logout': '🚪',
    'delete': '🗑️',
  };
  return icons[iconName] || '⚙️';
};

// Auth hook
const useAuthHeaders = () => {
  try {
    const { useAuth } = require('../../contexts/AuthContext');
    const { auth } = useAuth?.() ?? {};
    return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
  } catch {
    return {};
  }
};

// Settings hook
const useUserPreferences = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async (): Promise<UserPreferences> => {
      // Mock user preferences (replace with real API)
      return {
        darkMode: true,
        theme: 'dark',
        textSize: 16,
        layoutDensity: 'comfortable',
        hapticFeedback: true,
        animations: true,
        notifications: true,
        pushNotifications: true,
        tuneUpdates: true,
        communityNotifications: false,
        marketingEmails: false,
        aiRecommendations: true,
        performanceLevel: 'balanced',
        safetyTolerance: 'high',
        autoUpdateTunes: false,
        privacyMode: false,
        locationAccess: true,
        analytics: true,
        crashReporting: true,
        aiTrainingData: true,
        autoDownload: true,
        cloudSync: true,
        offlineMode: false,
        autoBackup: true,
        language: 'en',
        timezone: 'UTC',
        units: 'metric',
        developerMode: false,
      };
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!authHeaders.Authorization,
  });
};

const useAppInfo = () => {
  return useQuery({
    queryKey: ['app', 'info'],
    queryFn: async (): Promise<AppInfo> => {
      const userAgent = navigator.userAgent;
      const getBrowser = () => {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
      };
      
      const getOS = () => {
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown';
      };

      return {
        version: '1.0.0',
        buildNumber: '2024.02.15',
        platform: 'Web',
        deviceInfo: {
          browser: getBrowser(),
          os: getOS(),
          screen: `${window.screen.width}x${window.screen.height}`,
        },
      };
    },
    staleTime: Infinity,
  });
};

// Components
const SettingsToggle: React.FC<{
  item: SettingsItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ item, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{getIcon(item.icon)}</span>
      <div>
        <div className="font-medium text-white/90">{item.label}</div>
        {item.description && (
          <div className="text-sm text-white/60 mt-1">{item.description}</div>
        )}
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const SettingsNavigationItem: React.FC<{
  item: SettingsItem;
}> = ({ item }) => {
  const content = (
    <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getIcon(item.icon)}</span>
        <div>
          <div className="font-medium text-white/90 group-hover:text-white transition-colors">{item.label}</div>
          {item.description && (
            <div className="text-sm text-white/60 mt-1">{item.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.badge && (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            {item.badge}
          </span>
        )}
        <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  if (item.href) {
    return <Link to={item.href}>{content}</Link>;
  }

  return (
    <button onClick={item.onClick} className="w-full text-left">
      {content}
    </button>
  );
};

const QuickToggles: React.FC<{
  preferences: UserPreferences;
  updatePreference: (key: keyof UserPreferences, value: any) => void;
}> = ({ preferences, updatePreference }) => {
  const quickToggles = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'notifications',
      value: preferences.notifications,
      onChange: (value: boolean) => updatePreference('notifications', value),
    },
    {
      id: 'darkMode',
      label: 'Dark Mode',
      icon: 'palette',
      value: preferences.darkMode,
      onChange: (value: boolean) => updatePreference('darkMode', value),
    },
    {
      id: 'aiRecommendations',
      label: 'AI Recommendations',
      icon: 'speed',
      value: preferences.aiRecommendations,
      onChange: (value: boolean) => updatePreference('aiRecommendations', value),
    },
    {
      id: 'cloudSync',
      label: 'Cloud Sync',
      icon: 'cloud',
      value: preferences.cloudSync,
      onChange: (value: boolean) => updatePreference('cloudSync', value),
    },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white/90 mb-4">Quick Settings</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickToggles.map((toggle) => (
          <div key={toggle.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getIcon(toggle.icon)}</span>
              <span className="text-sm font-medium text-white/90">{toggle.label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggle.value}
                onChange={(e) => toggle.onChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const preferences = useUserPreferences();
  const appInfo = useAppInfo();

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: keyof UserPreferences; value: any }) => {
      // Mock API call to update preferences
      console.log(`Updating ${key} to:`, value);
      return { key, value };
    },
  });

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    updatePreferenceMutation.mutate({ key, value });
  };

  useEffect(() => {
    document.title = 'Settings • RevSync';
  }, []);

  if (!preferences.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Manage your personal information and preferences',
      items: [
        {
          id: 'profile',
          label: 'Profile & Personal Info',
          icon: 'account-circle',
          type: 'navigation',
          description: 'Manage your profile, display name, and personal information',
          href: '/settings/profile',
        },
        {
          id: 'garage',
          label: 'My Garage',
          icon: 'garage',
          type: 'navigation',
          description: 'Manage your motorcycles and vehicle profiles',
          href: '/garage',
        },
        {
          id: 'tune-preferences',
          label: 'Tuning Preferences',
          icon: 'tune',
          type: 'navigation',
          description: 'Performance level, safety tolerance, and tuning style',
          href: '/settings/performance/tuning-preferences',
        },
        {
          id: 'subscription',
          label: 'Subscription & Billing',
          icon: 'credit-card',
          type: 'navigation',
          description: 'Manage your RevSync subscription and payment methods',
          href: '/settings/billing/subscription',
          badge: 'Pro',
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Control your security settings and data privacy',
      items: [
        {
          id: 'security',
          label: 'Password & Security',
          icon: 'shield',
          type: 'navigation',
          description: 'Two-factor authentication, password, and login security',
          href: '/settings/security',
        },
        {
          id: 'privacy',
          label: 'Privacy Settings',
          icon: 'privacy',
          type: 'navigation',
          description: 'Data sharing, analytics, and privacy controls',
          href: '/settings/security/privacy',
        },
      ],
    },
    {
      id: 'interface',
      title: 'Interface & Experience',
      description: 'Customize your app experience and preferences',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: 'notifications',
          type: 'toggle',
          description: 'Enable or disable app notifications',
          value: preferences.data.notifications,
          onChange: (value: boolean) => updatePreference('notifications', value),
        },
        {
          id: 'theme',
          label: 'Theme',
          icon: 'palette',
          type: 'select',
          description: 'Choose your preferred color scheme',
          value: preferences.data.theme,
          onChange: (value: string) => updatePreference('theme', value),
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'System', value: 'system' },
          ],
        },
        {
          id: 'performance-level',
          label: 'Performance Level',
          icon: 'speed',
          type: 'select',
          description: 'Default performance preference for recommendations',
          value: preferences.data.performanceLevel,
          onChange: (value: string) => updatePreference('performanceLevel', value),
          options: [
            { label: 'Conservative', value: 'conservative' },
            { label: 'Balanced', value: 'balanced' },
            { label: 'Aggressive', value: 'aggressive' },
          ],
        },
      ],
    },
    {
      id: 'data',
      title: 'Data & Sync',
      description: 'Control data usage and synchronization',
      items: [
        {
          id: 'cloud-sync',
          label: 'Cloud Sync',
          icon: 'cloud',
          type: 'toggle',
          description: 'Sync your data across devices',
          value: preferences.data.cloudSync,
          onChange: (value: boolean) => updatePreference('cloudSync', value),
        },
        {
          id: 'auto-backup',
          label: 'Auto Backup',
          icon: 'cloud',
          type: 'toggle',
          description: 'Automatically backup your settings and data',
          value: preferences.data.autoBackup,
          onChange: (value: boolean) => updatePreference('autoBackup', value),
        },
      ],
    },
    {
      id: 'support',
      title: 'Help & Support',
      description: 'Get help and manage your account',
      items: [
        {
          id: 'help',
          label: 'Help & Support',
          icon: 'help',
          type: 'navigation',
          description: 'FAQ, tutorials, and contact support',
          href: '/settings/support',
        },
        {
          id: 'about',
          label: 'About RevSync',
          icon: 'info',
          type: 'navigation',
          description: 'App version, legal information, and credits',
          href: '/settings/support/about',
        },
        {
          id: 'legal',
          label: 'Legal Documents',
          icon: 'legal',
          type: 'navigation',
          description: 'Privacy policy, terms of service, and licenses',
          href: '/settings/legal',
        },
      ],
    },
  ];

  const filteredSections = searchQuery.length > 0
    ? settingsSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(section => section.items.length > 0)
    : settingsSections;

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white/90">Settings</h1>
                <p className="text-sm text-white/60">Manage your account and preferences</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Quick Toggles */}
        {searchQuery.length === 0 && (
          <QuickToggles
            preferences={preferences.data}
            updatePreference={updatePreference}
          />
        )}

        {/* Settings Sections */}
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white/90 mb-1">{section.title}</h2>
                {section.description && (
                  <p className="text-white/60 text-sm">{section.description}</p>
                )}
              </div>
              
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.id}>
                    {item.type === 'toggle' ? (
                      <SettingsToggle
                        item={item}
                        checked={item.value || false}
                        onChange={item.onChange || (() => {})}
                      />
                    ) : item.type === 'select' ? (
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getIcon(item.icon)}</span>
                            <div>
                              <div className="font-medium text-white/90">{item.label}</div>
                              {item.description && (
                                <div className="text-sm text-white/60 mt-1">{item.description}</div>
                              )}
                            </div>
                          </div>
                          <select
                            value={item.value}
                            onChange={(e) => item.onChange?.(e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {item.options?.map((option) => (
                              <option key={option.value} value={option.value} className="bg-black">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <SettingsNavigationItem item={item} />
                    )}
                  </div>
                ))}
              </div>
              
              {section.footer && (
                <p className="text-xs text-white/50 mt-3 px-4">{section.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* App Info Footer */}
        {searchQuery.length === 0 && appInfo.data && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-center space-y-2">
              <div className="text-white/60 text-sm">
                RevSync {appInfo.data.version} ({appInfo.data.buildNumber})
              </div>
              <div className="text-white/40 text-xs">
                {appInfo.data.platform} • {appInfo.data.deviceInfo.browser} on {appInfo.data.deviceInfo.os}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button className="text-red-400 hover:text-red-300 text-sm">
                  Sign Out
                </button>
                <button className="text-red-500 hover:text-red-400 text-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SettingsPage;
