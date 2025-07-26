import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';
import { Switch } from 'react-native-gesture-handler';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

// Custom Switch component to replace react-native Switch
const CustomSwitch = ({ value, onValueChange, trackColor }: { 
  value: boolean; 
  onValueChange: (value: boolean) => void; 
  trackColor?: any; 
}) => (
  <TouchableOpacity
    style={[
      styles.customSwitch,
      { backgroundColor: value ? trackColor?.true || '#007AFF' : trackColor?.false || '#E5E5EA' }
    ]}
    onPress={() => onValueChange(!value)}
  >
    <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
  </TouchableOpacity>
);

interface PrivacySettingsProps {
  navigation: any;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ navigation }) => {
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    personalizedAds: false,
    crashReporting: true,
    usageAnalytics: true,
    locationTracking: false,
    cookieConsent: true,
    marketingEmails: false,
    profileVisibility: 'public',
    searchEngineIndexing: true,
  });

  const updateSetting = (key: string, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Your Data',
      'Your data export will be prepared and sent to your email address within 24-48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Export', onPress: () => {
          Alert.alert('Export Requested', 'You will receive an email when your data is ready for download.');
        }},
      ]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data from our servers. This action cannot be undone.\n\nYour account will be deactivated and all associated data will be removed within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All Data', style: 'destructive', onPress: () => {
          Alert.alert('Deletion Requested', 'Your data deletion request has been submitted. You will receive a confirmation email.');
        }},
      ]
    );
  };

  const handleViewDataPolicy = () => {
    Alert.alert(
      'Data Policy',
      'Data policy viewer is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const PrivacyItem = ({ 
    icon, 
    title, 
    description, 
    rightComponent, 
    onPress, 
    showChevron = false,
    isLast = false 
  }: {
    icon: string;
    title: string;
    description: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    isLast?: boolean;
  }) => (
    <View>
      <TouchableOpacity 
        style={styles.privacyItem} 
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.itemLeft}>
          <View style={styles.iconContainer}>
            <TypedIcon name={icon} size={22} color={Theme.colors.accent.primary} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemDescription}>{description}</Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          {rightComponent}
          {showChevron && (
            <TypedIcon 
              name="chevron-right" 
              size={20} 
              color={Theme.colors.content.tertiary} 
            />
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <TypedIcon name="arrow-left" size={24} color={Theme.colors.content.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <View style={styles.sectionCard}>
            <PrivacyItem
              icon="database"
              title="Data Collection"
              description="Allow RevSync to collect usage data to improve the app"
              rightComponent={
                <CustomSwitch
                  value={privacySettings.dataCollection}
                  onValueChange={(value: boolean) => updateSetting('dataCollection', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            <PrivacyItem
              icon="chart-line"
              title="Usage Analytics"
              description="Help us understand how you use RevSync"
              rightComponent={
                <Switch
                  value={privacySettings.usageAnalytics}
                  onValueChange={(value: boolean) => updateSetting('usageAnalytics', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
              }
            />
            <PrivacyItem
              icon="bug"
              title="Crash Reporting"
              description="Automatically send crash reports to help fix issues"
              rightComponent={
                <Switch
                  value={privacySettings.crashReporting}
                  onValueChange={(value: boolean) => updateSetting('crashReporting', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
              }
              isLast
            />
          </View>
          <Text style={styles.sectionFooter}>
            This data is anonymized and helps us improve RevSync for everyone.
          </Text>
        </View>

        {/* Location & Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Tracking</Text>
          <View style={styles.sectionCard}>
            <PrivacyItem
              icon="map-marker"
              title="Location Tracking"
              description="Use your location for regional tune recommendations"
              rightComponent={
                <CustomSwitch
                  value={privacySettings.locationTracking}
                  onValueChange={(value: boolean) => updateSetting('locationTracking', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            <PrivacyItem
              icon="ads"
              title="Personalized Ads"
              description="Show ads based on your interests and activity"
              rightComponent={
                <Switch
                  value={privacySettings.personalizedAds}
                  onValueChange={(value: boolean) => updateSetting('personalizedAds', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
              }
              isLast
            />
          </View>
        </View>

        {/* Profile Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          <View style={styles.sectionCard}>
            <PrivacyItem
              icon="eye"
              title="Profile Visibility"
              description="Control who can see your profile"
              rightComponent={
                <Text style={styles.valueText}>
                  {privacySettings.profileVisibility === 'public' ? 'Public' : 'Private'}
                </Text>
              }
              showChevron
            />
            <PrivacyItem
              icon="google"
              title="Search Engine Indexing"
              description="Allow search engines to index your public profile"
              rightComponent={
                <CustomSwitch
                  value={privacySettings.searchEngineIndexing}
                  onValueChange={(value: boolean) => updateSetting('searchEngineIndexing', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
              isLast
            />
          </View>
        </View>

        {/* Communications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communications</Text>
          <View style={styles.sectionCard}>
            <PrivacyItem
              icon="email"
              title="Marketing Emails"
              description="Receive emails about new features and updates"
              rightComponent={
                <CustomSwitch
                  value={privacySettings.marketingEmails}
                  onValueChange={(value: boolean) => updateSetting('marketingEmails', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            <PrivacyItem
              icon="cookie"
              title="Cookie Consent"
              description="Allow cookies for website functionality"
              rightComponent={
                <CustomSwitch
                  value={privacySettings.cookieConsent}
                  onValueChange={(value: boolean) => updateSetting('cookieConsent', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
              isLast
            />
          </View>
        </View>

        {/* Data Rights (GDPR) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>
          <View style={styles.sectionCard}>
            <PrivacyItem
              icon="download"
              title="Export Your Data"
              description="Download a copy of all your data (GDPR compliant)"
              onPress={handleDataExport}
              showChevron
            />
            <PrivacyItem
              icon="file-document"
              title="View Data Policy"
              description="See what data we collect and how it's used"
              onPress={handleViewDataPolicy}
              showChevron
            />
            <PrivacyItem
              icon="delete-forever"
              title="Delete All Data"
              description="Permanently remove all your data from our servers"
              onPress={handleDataDeletion}
              rightComponent={
                <TypedIcon 
                  name="alert" 
                  size={20} 
                  color={Theme.colors.semantic.warning} 
                />
              }
              showChevron
              isLast
            />
          </View>
          <Text style={styles.sectionFooter}>
            These rights are provided under GDPR, CCPA, and other privacy laws. Data deletion requests are processed within 30 days.
          </Text>
        </View>

        {/* Compliance Info */}
        <View style={styles.complianceInfo}>
          <TypedIcon name="shield-check" size={24} color={Theme.colors.semantic.success} />
          <View style={styles.complianceText}>
            <Text style={styles.complianceTitle}>Privacy Compliant</Text>
            <Text style={styles.complianceDescription}>
              RevSync complies with GDPR, CCPA, and other international privacy regulations. 
              Last updated: January 15, 2025
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.content.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.content.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  sectionFooter: {
    fontSize: 13,
    color: Theme.colors.content.secondary,
    marginTop: 8,
    marginHorizontal: 20,
    lineHeight: 18,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Theme.colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.content.primary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    lineHeight: 20,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.content.divider,
    marginLeft: 68,
  },
  complianceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Theme.colors.semantic.success}15`,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  complianceText: {
    flex: 1,
    marginLeft: 12,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.semantic.success,
    marginBottom: 4,
  },
  complianceDescription: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    lineHeight: 20,
  },
  customSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default PrivacySettings; 