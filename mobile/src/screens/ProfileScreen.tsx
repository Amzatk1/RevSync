import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';

import { Theme } from '../styles/theme';
import { RootState } from '../store';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_creator: boolean;
  creator_verified: boolean;
  total_purchases: number;
  total_downloads: number;
  member_since: string;
  subscription_type: 'free' | 'premium' | 'creator';
}

interface UserSettings {
  notifications: {
    tune_updates: boolean;
    flash_status: boolean;
    marketplace_deals: boolean;
    safety_alerts: boolean;
  };
  safety: {
    require_manual_consent: boolean;
    enable_safety_mode: boolean;
    auto_backup: boolean;
    temperature_warnings: boolean;
  };
  privacy: {
    public_profile: boolean;
    share_flash_logs: boolean;
    anonymous_telemetry: boolean;
  };
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    username: 'RiderTech',
    email: 'rider@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    is_creator: false,
    creator_verified: false,
    total_purchases: 12,
    total_downloads: 24,
    member_since: '2023-06-15',
    subscription_type: 'premium',
  });

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      tune_updates: true,
      flash_status: true,
      marketplace_deals: false,
      safety_alerts: true,
    },
    safety: {
      require_manual_consent: true,
      enable_safety_mode: true,
      auto_backup: true,
      temperature_warnings: true,
    },
    privacy: {
      public_profile: true,
      share_flash_logs: false,
      anonymous_telemetry: true,
    },
  });

  const [activeSection, setActiveSection] = useState<'account' | 'settings' | 'safety' | 'legal'>('account');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Load user profile from API
      // For now using mock data
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const updateSettings = (section: keyof UserSettings, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleBecomeCreator = () => {
    Alert.alert(
      'Become a Creator',
      'Start selling your tunes and earn 70% revenue share. You\'ll need to verify your expertise.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => console.log('Creator application pressed') },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Dispatch logout action
          // navigation.navigate('Login');
        }},
      ]
    );
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return `Member since ${date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })}`;
  };

  const getSubscriptionBadge = (type: string) => {
    switch (type) {
      case 'premium':
        return { label: 'Premium', color: Theme.colors.warning, icon: 'crown' };
      case 'creator':
        return { label: 'Creator', color: Theme.colors.primary, icon: 'star' };
      default:
        return { label: 'Free', color: Theme.colors.textSecondary, icon: 'account' };
    }
  };

  const renderAccountSection = () => (
    <View style={styles.section}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: profile.avatar_url || 'https://via.placeholder.com/80x80' }}
          style={styles.profileAvatar}
        />
        
        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>{profile.username}</Text>
            {profile.creator_verified && (
              <Icon name="check-decagram" size={20} color={Theme.colors.primary} />
            )}
          </View>
          
          <Text style={styles.profileEmail}>{profile.email}</Text>
          
          <View style={styles.subscriptionBadge}>
            <Icon 
              name={getSubscriptionBadge(profile.subscription_type).icon} 
              size={14} 
              color={getSubscriptionBadge(profile.subscription_type).color} 
            />
            <Text style={[
              styles.subscriptionText,
              { color: getSubscriptionBadge(profile.subscription_type).color }
            ]}>
              {getSubscriptionBadge(profile.subscription_type).label}
            </Text>
          </View>
          
          <Text style={styles.memberSince}>
            {formatMemberSince(profile.member_since)}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => console.log('Edit profile pressed')}
        >
          <Icon name="pencil" size={16} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="shopping" size={24} color={Theme.colors.primary} />
          <Text style={styles.statNumber}>{profile.total_purchases}</Text>
          <Text style={styles.statLabel}>Purchases</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="download" size={24} color={Theme.colors.success} />
          <Text style={styles.statNumber}>{profile.total_downloads}</Text>
          <Text style={styles.statLabel}>Downloads</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="flash" size={24} color={Theme.colors.warning} />
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Flashes</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Purchase history pressed')}
        >
          <Icon name="history" size={20} color={Theme.colors.text} />
          <Text style={styles.actionButtonText}>Purchase History</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Flash history pressed')}
        >
          <Icon name="database" size={20} color={Theme.colors.text} />
          <Text style={styles.actionButtonText}>Flash History</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Payment methods pressed')}
        >
          <Icon name="credit-card" size={20} color={Theme.colors.text} />
          <Text style={styles.actionButtonText}>Payment Methods</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        {!profile.is_creator && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.creatorButton]}
            onPress={handleBecomeCreator}
          >
            <Icon name="star-outline" size={20} color={Theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: Theme.colors.primary }]}>
              Become a Creator
            </Text>
            <Icon name="chevron-right" size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      
      <View style={styles.settingGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Tune Updates</Text>
            <Text style={styles.settingDescription}>
              Get notified when purchased tunes are updated
            </Text>
          </View>
          <Switch
            value={settings.notifications.tune_updates}
            onValueChange={(value) => updateSettings('notifications', 'tune_updates', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Flash Status</Text>
            <Text style={styles.settingDescription}>
              Notifications for successful/failed flash operations
            </Text>
          </View>
          <Switch
            value={settings.notifications.flash_status}
            onValueChange={(value) => updateSettings('notifications', 'flash_status', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Marketplace Deals</Text>
            <Text style={styles.settingDescription}>
              Special offers and discounts from creators
            </Text>
          </View>
          <Switch
            value={settings.notifications.marketplace_deals}
            onValueChange={(value) => updateSettings('notifications', 'marketplace_deals', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Privacy</Text>
      
      <View style={styles.settingGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Public Profile</Text>
            <Text style={styles.settingDescription}>
              Allow others to see your profile and stats
            </Text>
          </View>
          <Switch
            value={settings.privacy.public_profile}
            onValueChange={(value) => updateSettings('privacy', 'public_profile', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Share Flash Logs</Text>
            <Text style={styles.settingDescription}>
              Help improve safety by sharing anonymous flash data
            </Text>
          </View>
          <Switch
            value={settings.privacy.share_flash_logs}
            onValueChange={(value) => updateSettings('privacy', 'share_flash_logs', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
          />
        </View>
      </View>
    </View>
  );

  const renderSafetySection = () => (
    <View style={styles.section}>
      <View style={styles.safetyHeader}>
        <Icon name="shield-check" size={32} color={Theme.colors.primary} />
        <Text style={styles.safetyTitle}>Safety Settings</Text>
        <Text style={styles.safetySubtitle}>
          Configure safety features to protect your motorcycle
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Flash Safety</Text>
      
      <View style={styles.settingGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Manual Consent Required</Text>
            <Text style={styles.settingDescription}>
              Require confirmation for each flash operation
            </Text>
          </View>
          <Switch
            value={settings.safety.require_manual_consent}
            onValueChange={(value) => updateSettings('safety', 'require_manual_consent', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.danger }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Safety Mode</Text>
            <Text style={styles.settingDescription}>
              Enhanced safety checks and warnings
            </Text>
          </View>
          <Switch
            value={settings.safety.enable_safety_mode}
            onValueChange={(value) => updateSettings('safety', 'enable_safety_mode', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.danger }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Backup</Text>
            <Text style={styles.settingDescription}>
              Automatically backup ECU before flashing
            </Text>
          </View>
          <Switch
            value={settings.safety.auto_backup}
            onValueChange={(value) => updateSettings('safety', 'auto_backup', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.success }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Temperature Warnings</Text>
            <Text style={styles.settingDescription}>
              Alert for dangerous engine temperatures
            </Text>
          </View>
          <Switch
            value={settings.safety.temperature_warnings}
            onValueChange={(value) => updateSettings('safety', 'temperature_warnings', value)}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.warning }}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.safetyButton}
        onPress={() => console.log('Safety tutorial pressed')}
      >
        <Icon name="school" size={20} color={Theme.colors.white} />
        <Text style={styles.safetyButtonText}>Safety Tutorial</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLegalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal & Support</Text>
      
      <View style={styles.legalActions}>
        <TouchableOpacity 
          style={styles.legalButton}
          onPress={() => console.log('Terms of service pressed')}
        >
          <Icon name="file-document" size={20} color={Theme.colors.text} />
          <Text style={styles.legalButtonText}>Terms of Service</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.legalButton}
          onPress={() => console.log('Privacy policy pressed')}
        >
          <Icon name="shield" size={20} color={Theme.colors.text} />
          <Text style={styles.legalButtonText}>Privacy Policy</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.legalButton}
          onPress={() => console.log('Safety disclaimer pressed')}
        >
          <Icon name="alert-circle" size={20} color={Theme.colors.warning} />
          <Text style={styles.legalButtonText}>Safety Disclaimer</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.legalButton}
          onPress={() => console.log('Support pressed')}
        >
          <Icon name="help-circle" size={20} color={Theme.colors.info} />
          <Text style={styles.legalButtonText}>Help & Support</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.legalButton}
          onPress={() => console.log('About pressed')}
        >
          <Icon name="information" size={20} color={Theme.colors.text} />
          <Text style={styles.legalButtonText}>About RevSync</Text>
          <Icon name="chevron-right" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Theme.colors.danger} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Settings & account management</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'account', label: 'Account', icon: 'account' },
          { key: 'settings', label: 'Settings', icon: 'cog' },
          { key: 'safety', label: 'Safety', icon: 'shield' },
          { key: 'legal', label: 'Legal', icon: 'gavel' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeSection === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveSection(tab.key as any)}
          >
            <Icon
              name={tab.icon}
              size={18}
              color={activeSection === tab.key ? Theme.colors.primary : Theme.colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeSection === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSection === 'account' && renderAccountSection()}
        {activeSection === 'settings' && renderSettingsSection()}
        {activeSection === 'safety' && renderSafetySection()}
        {activeSection === 'legal' && renderLegalSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.white,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Theme.colors.background,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginLeft: 4,
  },
  activeTabText: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
    marginTop: 20,
  },
  profileCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginRight: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  editProfileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  creatorButton: {
    backgroundColor: Theme.colors.background,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 12,
  },
  settingGroup: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  safetyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  safetyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  safetySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  safetyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  safetyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.white,
    marginLeft: 8,
  },
  legalActions: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalButtonText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.danger,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
}); 