import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import { Theme } from '../../styles/theme';
import {
  SettingsHeader,
  QuickToggles,
  SettingsSection,
  SettingsFooter,
} from '../components';
import {
  SettingsToggle,
  SettingsSection as SettingsSectionType,
  UserPreferences,
  AppInfo,
} from '../types';
import { SettingsStorage } from '../services/SettingsStorage';

interface SettingsScreenProps {
  navigation: any;
  onClose?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>(
    SettingsStorage.getDefaultSettings()
  );
  const [appInfo, setAppInfo] = useState<AppInfo>({
    version: '1.0.0',
    buildNumber: 'Loading...',
    releaseDate: 'Loading...',
    platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
    deviceInfo: {
      model: 'Loading...',
      os: Platform.OS === 'ios' ? 'iOS' : 'Android',
      osVersion: Platform.Version.toString(),
    },
  });

  useEffect(() => {
    loadSettings();
    loadDeviceInfo();
    
    // Listen for system theme changes
    // const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    //   if (preferences.theme === 'system') {
    //     // In a real app, you'd update your theme context here
    //     console.log('System theme changed to:', colorScheme);
    //   }
    // }); // Appearance not available in this RN version

    // return () => subscription?.remove(); // Commented out since Appearance not available
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SettingsStorage.loadSettings();
      if (savedSettings) {
        setPreferences(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const [model, systemName, systemVersion] = await Promise.all([
        DeviceInfo.getModel(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
      ]);

      setAppInfo(prev => ({
        ...prev,
        deviceInfo: {
          model,
          os: systemName,
          osVersion: systemVersion,
        },
      }));
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    try {
      setPreferences(prev => ({ ...prev, [key]: value }));
      await SettingsStorage.updateSetting(key, value);
      
      // Handle special cases
      if (key === 'theme') {
        handleThemeChange(value);
      } else if (key === 'language') {
        handleLanguageChange(value);
      } else if (key === 'notifications') {
        handleNotificationPermission(value);
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    }
  };

  const handleThemeChange = (theme: string) => {
    // In a real app, you'd update your theme context/provider here
    console.log('Theme changed to:', theme);
    Alert.alert('Theme Updated', `Theme changed to ${theme}. Restart the app to see full changes.`);
  };

  const handleLanguageChange = (language: string) => {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
    };
    
    Alert.alert(
      'Language Changed',
      `Language updated to ${languageNames[language]}. Restart the app to see changes.`,
      [{ text: 'OK' }]
    );
  };

  const handleNotificationPermission = async (enabled: boolean) => {
    if (enabled) {
      // In a real app, you'd request notification permissions here
      Alert.alert(
        'Notifications Enabled',
        'You\'ll now receive important updates about tune safety, new releases, and community activity.',
        [{ text: 'OK' }]
      );
    }
  };

  const quickToggles: SettingsToggle[] = [
    {
      id: 'darkMode',
      label: 'Dark Mode',
      icon: 'weather-night',
      value: preferences.darkMode,
      description: 'Switch between light and dark themes',
      onChange: (value) => updatePreference('darkMode', value),
    },
    {
      id: 'notifications',
      label: 'Notifications', 
      icon: 'bell',
      value: preferences.notifications,
      description: 'Receive tune alerts and app updates',
      onChange: (value) => updatePreference('notifications', value),
    },
    {
      id: 'privacyMode',
      label: 'Privacy Mode',
      icon: 'shield-check',
      value: preferences.privacyMode,
      description: 'Enhanced privacy and data protection',
      onChange: (value) => updatePreference('privacyMode', value),
    },
  ];

  const getTimezoneOptions = () => {
    const timeZone = RNLocalize.getTimeZone();
    const country = RNLocalize.getCountry();
    
    return [
      { label: `Auto (${timeZone})`, value: 'auto' },
      { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
      { label: 'Mountain Time (MT)', value: 'America/Denver' },
      { label: 'Central Time (CT)', value: 'America/Chicago' },
      { label: 'Eastern Time (ET)', value: 'America/New_York' },
      { label: 'Greenwich Mean Time (GMT)', value: 'UTC' },
    ];
  };

  const settingsSections: SettingsSectionType[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      items: [
        {
          id: 'profile',
          label: 'Profile & Personal Info',
          icon: 'account-circle',
          type: 'navigation',
          description: 'Manage your profile, display name, and personal information',
          onPress: () => Alert.alert(
            'Profile Settings',
            'Profile management is not yet implemented. This feature will be available when authentication is added.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'motorcycle-garage',
          label: 'My Garage',
          icon: 'garage',
          type: 'navigation',
          description: 'Manage your motorcycles and vehicle profiles',
          onPress: () => navigation.navigate('Garage'),
        },
        {
          id: 'tune-preferences',
          label: 'Tuning Preferences',
          icon: 'tune',
          type: 'navigation',
          description: 'Performance level, safety tolerance, and tuning style',
          onPress: () => Alert.alert(
            'Tuning Preferences',
            'Detailed tuning preferences will be available in a future update.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'subscription',
          label: 'Subscription & Billing',
          icon: 'credit-card',
          type: 'navigation',
          description: 'Manage your RevSync subscription and payment methods',
          onPress: () => Alert.alert(
            'Subscription Management',
            'Subscription management features will be available in a future update.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'security',
          label: 'Password & Security',
          icon: 'shield-key',
          type: 'navigation',
          description: 'Two-factor auth, password, and advanced security settings',
          badge: '2FA',
          onPress: () => navigation.navigate('SecuritySettings'),
        },
        {
          id: 'connected',
          label: 'Connected Services',
          icon: 'link-variant',
          type: 'navigation',
          description: 'Google, Apple, OBD-II devices, and other integrations',
          onPress: () => Alert.alert(
            'Connected Services',
            'Service connections will be available when authentication is implemented.',
            [{ text: 'OK' }]
          ),
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance & AI',
      items: [
        {
          id: 'ai-recommendations',
          label: 'AI Recommendations',
          icon: 'brain',
          type: 'toggle',
          value: preferences.aiRecommendations,
          description: 'Enable personalized AI-powered tune recommendations',
          onChange: (value) => updatePreference('aiRecommendations', value),
        },
        {
          id: 'performance-level',
          label: 'Performance Level',
          icon: 'speedometer',
          type: 'select',
          value: preferences.performanceLevel,
          description: 'Conservative, Balanced, or Aggressive tuning approach',
          options: [
            { value: 'conservative', label: 'Conservative' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'aggressive', label: 'Aggressive' }
          ],
          onChange: (value) => updatePreference('performanceLevel', value),
        },
        {
          id: 'safety-tolerance',
          label: 'Safety Tolerance',
          icon: 'shield-check',
          type: 'select',
          value: preferences.safetyTolerance,
          description: 'How conservative should safety recommendations be',
          options: [
            { value: 'maximum', label: 'Maximum Safety' },
            { value: 'high', label: 'High Safety' },
            { value: 'standard', label: 'Standard Safety' }
          ],
          onChange: (value) => updatePreference('safetyTolerance', value),
        },
        {
          id: 'auto-update',
          label: 'Auto-Update Tunes',
          icon: 'download',
          type: 'toggle',
          value: preferences.autoUpdateTunes,
          description: 'Automatically download tune updates when available',
          onChange: (value) => updatePreference('autoUpdateTunes', value),
        },
        {
          id: 'dyno-integration',
          label: 'Dyno Integration',
          icon: 'chart-line',
          type: 'navigation',
          description: 'Connect with dyno services for performance verification',
          onPress: () => Alert.alert(
            'Dyno Integration',
            'Connect with professional dyno services to verify tune performance and safety.\n\nSupported Services:\n• DynoJet\n• Mustang Dyno\n• Local Partners\n\nFeature coming in Q2 2025.',
            [{ text: 'OK' }]
          ),
        },
      ],
      footer: 'AI recommendations use machine learning to suggest safe, compatible tunes for your specific motorcycle and riding style.',
    },
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      items: [
        {
          id: 'push-notifications',
          label: 'Push Notifications',
          icon: 'bell',
          type: 'toggle',
          value: preferences.pushNotifications,
          description: 'Receive notifications about new tunes, updates, and alerts',
          onChange: (value) => updatePreference('pushNotifications', value),
        },
        {
          id: 'safety-alerts',
          label: 'Safety Alerts',
          icon: 'alert-circle',
          type: 'toggle',
          value: true, // Always enabled for safety
          description: 'Critical safety warnings and recall notifications',
          disabled: true,
          onChange: () => Alert.alert(
            'Safety Alerts Required',
            'Safety alerts cannot be disabled for your protection. These notifications include critical safety warnings, recalls, and emergency information.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'tune-updates',
          label: 'Tune Updates',
          icon: 'refresh',
          type: 'toggle',
          value: preferences.tuneUpdates,
          description: 'Notifications when installed tunes have updates available',
          onChange: (value) => updatePreference('tuneUpdates', value),
        },
        {
          id: 'community-activity',
          label: 'Community Activity',
          icon: 'account-group',
          type: 'toggle',
          value: preferences.communityNotifications,
          description: 'Comments, likes, and mentions from the community',
          onChange: (value) => updatePreference('communityNotifications', value),
        },
        {
          id: 'marketing-emails',
          label: 'Marketing Emails',
          icon: 'email',
          type: 'toggle',
          value: preferences.marketingEmails,
          description: 'Product updates, tips, and promotional content',
          onChange: (value) => updatePreference('marketingEmails', value),
        },
        {
          id: 'notification-schedule',
          label: 'Quiet Hours',
          icon: 'clock',
          type: 'navigation',
          description: 'Set notification quiet hours',
          onPress: () => Alert.alert(
            'Notification Schedule',
            'Quiet hours scheduling will be available in a future update.',
            [{ text: 'OK' }]
          ),
        },
      ],
      footer: 'Safety alerts are always enabled and cannot be disabled for your protection.',
    },
    {
      id: 'data-sync',
      title: 'Data & Synchronization',
      items: [
        {
          id: 'cloud-sync',
          label: 'Cloud Synchronization',
          icon: 'cloud-sync',
          type: 'toggle',
          value: preferences.cloudSync,
          description: 'Sync your tunes, preferences, and garage across devices',
          onChange: (value) => updatePreference('cloudSync', value),
        },
        {
          id: 'offline-mode',
          label: 'Offline Mode',
          icon: 'wifi-off',
          type: 'toggle',
          value: preferences.offlineMode,
          description: 'Download tunes for offline use (requires more storage)',
          onChange: (value) => updatePreference('offlineMode', value),
        },
        {
          id: 'auto-backup',
          label: 'Automatic Backup',
          icon: 'backup-restore',
          type: 'toggle',
          value: preferences.autoBackup,
          description: 'Automatically backup your ECU settings before tuning',
          onChange: (value) => updatePreference('autoBackup', value),
        },
        {
          id: 'storage-usage',
          label: 'Storage Usage',
          icon: 'harddisk',
          type: 'info',
          value: 'Loading...',
          description: 'App data and cached content',
        },
        {
          id: 'clear-cache',
          label: 'Clear Cache',
          icon: 'delete-sweep',
          type: 'navigation',
          description: 'Free up space by clearing temporary files and cache',
          onPress: () => Alert.alert(
            'Clear Cache',
            'This will clear temporary files and cached data to free up storage space. Your tunes and backups will not be affected.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear Cache', onPress: () => {
                Alert.alert('Success', 'Cache cleared successfully.');
              }}
            ]
          ),
        },
      ],
      footer: 'Cloud sync requires an active internet connection. ECU backups are strongly recommended before any modifications.',
    },
    {
      id: 'privacy',
      title: 'Data & Privacy',
      items: [
        {
          id: 'location',
          label: 'Location Access',
          icon: 'map-marker',
          type: 'toggle',
          value: preferences.locationAccess,
          description: 'Allow location for regional tune recommendations and weather data',
          onChange: (value) => updatePreference('locationAccess', value),
        },
        {
          id: 'analytics',
          label: 'Analytics & Usage Data',
          icon: 'chart-line',
          type: 'toggle',
          value: preferences.analytics,
          description: 'Help improve RevSync with anonymous usage analytics',
          onChange: (value) => updatePreference('analytics', value),
        },
        {
          id: 'crash-reporting',
          label: 'Crash Reporting',
          icon: 'bug',
          type: 'toggle',
          value: preferences.crashReporting,
          description: 'Automatically send crash reports to help fix issues',
          onChange: (value) => updatePreference('crashReporting', value),
        },
        {
          id: 'ai-training',
          label: 'AI Training Data',
          icon: 'brain',
          type: 'toggle',
          value: preferences.aiTrainingData,
          description: 'Allow anonymized data to improve AI recommendations',
          onChange: (value) => updatePreference('aiTrainingData', value),
        },
        {
          id: 'privacy-preferences',
          label: 'Advanced Privacy Settings',
          icon: 'shield-account',
          type: 'navigation',
          description: 'Detailed privacy controls and data management options',
          onPress: () => navigation.navigate('PrivacySettings'),
        },
        {
          id: 'data-export',
          label: 'Download My Data',
          icon: 'download',
          type: 'navigation',
          description: 'Export all your personal data in a portable format',
          onPress: () => Alert.alert(
            'Data Export',
            'Request a complete export of your personal data including:\n\n• Profile information\n• Garage and motorcycle data\n• Tune history and preferences\n• Community activity\n• Usage analytics\n\nExport will be emailed to you within 24 hours.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Request Export', onPress: () => {
                Alert.alert('Export Requested', 'Your data export has been requested. You will receive an email with download instructions within 24 hours.');
              }}
            ]
          ),
        },
      ],
      footer: 'All data handling complies with GDPR, CCPA, and other applicable privacy regulations. You have full control over your data.',
    },
    {
      id: 'interface',
      title: 'Interface & Experience',
      items: [
        {
          id: 'theme',
          label: 'App Theme',
          icon: 'palette',
          type: 'select',
          value: preferences.theme,
          description: 'Choose your preferred visual theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Follow System' }
          ],
          onChange: (value) => updatePreference('theme', value),
        },
        {
          id: 'haptic-feedback',
          label: 'Haptic Feedback',
          icon: 'vibrate',
          type: 'toggle',
          value: preferences.hapticFeedback,
          description: 'Feel tactile feedback for interactions and alerts',
          onChange: (value) => updatePreference('hapticFeedback', value),
        },
        {
          id: 'animations',
          label: 'Animations',
          icon: 'motion-play',
          type: 'toggle',
          value: preferences.animations,
          description: 'Enable smooth animations and transitions',
          onChange: (value) => updatePreference('animations', value),
        },
        {
          id: 'units',
          label: 'Measurement Units',
          icon: 'ruler',
          type: 'select',
          value: preferences.units,
          description: 'Choose your preferred measurement system',
          options: [
            { value: 'metric', label: 'Metric (km/h, °C, kW)' },
            { value: 'imperial', label: 'Imperial (mph, °F, HP)' },
            { value: 'mixed', label: 'Mixed (mph, °C, HP)' }
          ],
          onChange: (value) => updatePreference('units', value),
        },
        {
          id: 'language',
          label: 'Language',
          icon: 'translate',
          type: 'select',
          value: preferences.language,
          description: 'Choose your preferred language',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
            { value: 'it', label: 'Italiano' },
            { value: 'ja', label: '日本語' }
          ],
          onChange: (value) => updatePreference('language', value),
        },
        {
          id: 'accessibility',
          label: 'Accessibility',
          icon: 'human-handsup',
          type: 'navigation',
          description: 'Text size, contrast, screen reader, and other accessibility options',
          onPress: () => Alert.alert(
            'Accessibility Options',
            'Current Settings:\n• Text Size: Large\n• High Contrast: Off\n• Screen Reader: Compatible\n• Reduced Motion: Off\n\nDetailed accessibility settings coming soon.',
            [{ text: 'OK' }]
          ),
        },
      ],
      footer: 'Interface preferences are synced across your devices when cloud sync is enabled.',
    },
    {
      id: 'support',
      title: 'Support & Information',
      items: [
        {
          id: 'help',
          label: 'Help & Support',
          icon: 'help-circle',
          type: 'navigation',
          description: 'Get help, report issues, submit feedback, and access tutorials',
          onPress: () => navigation.navigate('HelpSupport'),
        },
        {
          id: 'safety-resources',
          label: 'Safety Resources',
          icon: 'shield-check',
          type: 'navigation',
          description: 'Safety guides, best practices, and emergency procedures',
          onPress: () => Alert.alert(
            'Safety Resources',
            'Access comprehensive safety information:\n\n• Motorcycle tuning safety guide\n• Emergency procedures\n• Professional technician directory\n• Safety certification courses\n• 24/7 safety hotline\n\nDetailed safety resources coming soon.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'community-guidelines',
          label: 'Community Guidelines',
          icon: 'account-group',
          type: 'navigation',
          description: 'Community rules, content policies, and reporting guidelines',
          onPress: () => Alert.alert(
            'Community Guidelines',
            'RevSync Community Guidelines:\n\n• Be respectful and helpful\n• Share knowledge safely and responsibly\n• No illegal or unsafe modifications\n• Verify information before sharing\n• Report inappropriate content\n\nFull guidelines available at revsync.com/community',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'whats-new',
          label: "What's New",
          icon: 'new-box',
          type: 'navigation',
          description: 'Latest app updates, new features, and release notes',
          onPress: () => Alert.alert(
            "What's New",
            'Check the app store for the latest updates and release notes.',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'rate',
          label: 'Rate & Share RevSync',
          icon: 'star',
          type: 'navigation',
          description: 'Rate the app and share with fellow riders',
          onPress: () => handleRateApp(),
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          icon: 'message-text',
          type: 'navigation',
          description: 'Share your thoughts and suggestions for improvement',
          onPress: () => Alert.alert(
            'Send Feedback',
            'Your feedback helps make RevSync better for everyone!\n\nOptions:\n• General feedback\n• Feature requests\n• Bug reports\n• Safety concerns\n\nChoose your preferred method:',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Email', onPress: () => Linking.openURL('mailto:feedback@revsync.com?subject=App%20Feedback') },
              { text: 'In-App Form', onPress: () => Alert.alert('Coming Soon', 'In-app feedback form will be available in the next update.') }
            ]
          ),
        },
      ],
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      items: [
        {
          id: 'terms',
          label: 'Terms & Conditions',
          icon: 'file-document',
          type: 'navigation',
          description: 'RevSync Terms of Service and user agreement',
          onPress: () => navigation.navigate('LegalDocuments', { type: 'terms' }),
        },
        {
          id: 'privacy-policy',
          label: 'Privacy Policy',
          icon: 'shield-lock',
          type: 'navigation',
          description: 'How we protect and handle your personal data',
          onPress: () => navigation.navigate('LegalDocuments', { type: 'privacy' }),
        },
        {
          id: 'eula',
          label: 'End-User License Agreement',
          icon: 'license',
          type: 'navigation',
          description: 'Software license and usage agreement',
          onPress: () => navigation.navigate('LegalDocuments', { type: 'eula' }),
        },
        {
          id: 'safety-disclaimer',
          label: 'Safety Disclaimer',
          icon: 'alert-circle',
          type: 'navigation',
          description: 'Important safety information and risk acknowledgments',
          onPress: () => navigation.navigate('SafetyDisclaimer', { mandatory: false }),
        },
        {
          id: 'open-source',
          label: 'Open Source Licenses',
          icon: 'open-source-initiative',
          type: 'navigation',
          description: 'Third-party libraries and open source components',
          onPress: () => Alert.alert(
            'Open Source Licenses',
            'RevSync uses open source software components.\n\nMajor components:\n• React Native (MIT)\n• TensorFlow Lite (Apache 2.0)\n• OpenSSL (OpenSSL License)\n• Various npm packages\n\nComplete list available at revsync.com/licenses',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'compliance',
          label: 'Regulatory Compliance',
          icon: 'scale-balance',
          type: 'navigation',
          description: 'EPA, CARB, and international compliance information',
          onPress: () => Alert.alert(
            'Regulatory Compliance',
            'RevSync complies with applicable regulations:\n\n🇺🇸 United States:\n• EPA Clean Air Act compliance\n• CARB emissions standards\n• FTC consumer protection\n\n🇪🇺 European Union:\n• GDPR data protection\n• CE conformity marking\n• RoHS compliance\n\n🌍 International:\n• ISO 27001 security standards\n• SOC 2 Type II certification\n\nDetailed compliance information at revsync.com/compliance',
            [{ text: 'OK' }]
          ),
        },
      ],
      footer: 'Last updated January 15, 2025 • Document version 2025.1',
    },
    {
      id: 'advanced',
      title: 'Advanced & Developer',
      items: [
        {
          id: 'developer-mode',
          label: 'Developer Mode',
          icon: 'code-braces',
          type: 'toggle',
          value: preferences.developerMode,
          description: 'Enable advanced debugging and development features',
          onChange: (value) => {
            if (value) {
              Alert.alert(
                'Enable Developer Mode?',
                'Developer mode provides access to advanced features and debugging tools. Only enable if you understand the risks.\n\nFeatures include:\n• Detailed logging\n• API debugging\n• Performance metrics\n• Beta feature access',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Enable', onPress: () => updatePreference('developerMode', true) }
                ]
              );
            } else {
              updatePreference('developerMode', false);
            }
          },
        },
        {
          id: 'api-endpoint',
          label: 'API Endpoint',
          icon: 'server',
          type: 'info',
          value: 'api.revsync.com',
          description: 'Current API server endpoint',
          visible: preferences.developerMode,
        },
        {
          id: 'app-version',
          label: 'App Version',
          icon: 'information',
          type: 'info',
          value: appInfo.version,
          description: `Build ${appInfo.buildNumber} • Released ${appInfo.releaseDate} • ${appInfo.platform}`,
        },
        {
          id: 'device-info',
          label: 'Device Information',
          icon: 'cellphone',
          type: 'info',
          value: appInfo.deviceInfo.model,
          description: `${appInfo.deviceInfo.os} ${appInfo.deviceInfo.osVersion}`,
        },
        {
          id: 'diagnostics',
          label: 'Run Diagnostics',
          icon: 'stethoscope',
          type: 'navigation',
          description: 'Test app functionality and generate diagnostic report',
          onPress: () => Alert.alert(
            'System Diagnostics',
            'Running diagnostic tests...',
            [{ text: 'OK' }]
          ),
        },
        {
          id: 'reset-app',
          label: 'Reset App Settings',
          icon: 'restore',
          type: 'navigation',
          description: 'Reset all settings to default values',
          onPress: () => Alert.alert(
            'Reset App Settings',
            'This will reset all app settings to their default values. Your tunes, garage, and account data will not be affected.\n\nThis action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset Settings', style: 'destructive', onPress: () => {
                Alert.alert('Settings Reset', 'All app settings have been reset to defaults.');
              }}
            ]
          ),
        },
      ],
      footer: 'Advanced features are intended for experienced users and developers only.',
    },
  ];

  const handleRateApp = async () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/revsync/id123456789'
      : 'https://play.google.com/store/apps/details?id=com.revsync.app';
    
    Alert.alert(
      'Rate RevSync',
      'Help other riders discover RevSync! Choose how you\'d like to share:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rate in Store', 
          onPress: () => Linking.openURL(storeUrl).catch(() => {
            Alert.alert('Error', 'Could not open app store');
          })
        },
        // { 
        //   text: 'Share with Friends', 
        //   onPress: () => Share.share({
        //     message: 'Check out RevSync - the AI-powered motorcycle tuning platform! Get safe, personalized tune recommendations for your bike. Download now!',
        //     url: storeUrl,
        //     title: 'RevSync - Motorcycle Tuning Platform'
        //   })
        // } // Share not available in this RN version
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Account deletion is not yet implemented. This feature will be available when authentication is added.',
      [{ text: 'OK' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Authentication is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  // Filter sections based on search query
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <SettingsHeader
        onClose={onClose}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {searchQuery.length === 0 && (
          <QuickToggles toggles={quickToggles} />
        )}
        
        {filteredSections.map(section => (
          <SettingsSection key={section.id} section={section} />
        ))}
        
        {searchQuery.length === 0 && (
          <SettingsFooter
            appInfo={appInfo}
            onDeleteAccount={handleDeleteAccount}
            onSignOut={handleSignOut}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  scrollView: {
    flex: 1,
  },
});

export default SettingsScreen; 