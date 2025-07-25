import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../types';

const SETTINGS_KEY = '@RevSync:UserSettings';

export class SettingsStorage {
  static async saveSettings(settings: UserPreferences): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  static async loadSettings(): Promise<UserPreferences | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  static async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error('Failed to clear settings:', error);
      throw error;
    }
  }

  static async updateSetting<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings = {
        ...this.getDefaultSettings(),
        ...currentSettings,
        [key]: value,
      };
      await this.saveSettings(newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }

  static getDefaultSettings(): UserPreferences {
    return {
      // Interface & Theme
      darkMode: false,
      theme: 'system',
      textSize: 16,
      layoutDensity: 'comfortable',
      hapticFeedback: true,
      animations: true,
      
      // Notifications
      notifications: true,
      pushNotifications: true,
      tuneUpdates: true,
      communityNotifications: true,
      marketingEmails: false,
      
      // Performance & AI
      aiRecommendations: true,
      performanceLevel: 'balanced',
      safetyTolerance: 'high',
      autoUpdateTunes: false,
      
      // Data & Privacy
      privacyMode: false,
      locationAccess: false,
      analytics: true,
      crashReporting: true,
      aiTrainingData: true,
      
      // Data & Sync
      autoDownload: true,
      cloudSync: true,
      offlineMode: false,
      autoBackup: true,
      
      // Localization
      language: 'en',
      timezone: 'auto',
      units: 'imperial',
      
      // Advanced
      developerMode: false,
    };
  }
} 