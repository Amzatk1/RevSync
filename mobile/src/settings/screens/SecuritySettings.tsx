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

interface SecuritySettingsProps {
  navigation: any;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ navigation }) => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    biometricLogin: true,
    sessionTimeout: '30',
    loginAlerts: true,
    deviceManagement: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password management is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleSetupTwoFactor = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Two-factor authentication setup is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleViewLoginHistory = () => {
    Alert.alert(
      'Login History',
      'Login history viewing is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleManageDevices = () => {
    Alert.alert(
      'Device Management',
      'Device management is not yet implemented. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const SecurityItem = ({ 
    icon, 
    title, 
    description, 
    rightComponent, 
    onPress, 
    showChevron = false 
  }: {
    icon: string;
    title: string;
    description: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.securityItem} 
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
        <Text style={styles.headerTitle}>Password & Security</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>
          <View style={styles.sectionCard}>
            <SecurityItem
              icon="lock"
              title="Change Password"
              description="Update your account password"
              onPress={handleChangePassword}
              showChevron
            />
            <View style={styles.divider} />
            <SecurityItem
              icon="clock-time-four"
              title="Last Password Change"
              description="January 1, 2025"
              rightComponent={
                <Text style={styles.statusText}>15 days ago</Text>
              }
            />
          </View>
        </View>

        {/* Two-Factor Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          <View style={styles.sectionCard}>
            <SecurityItem
              icon="shield-key"
              title="Two-Factor Authentication"
              description={securitySettings.twoFactorEnabled 
                ? "Enabled with authenticator app" 
                : "Add extra security to your account"
              }
              rightComponent={
                <CustomSwitch
                  value={securitySettings.twoFactorEnabled}
                  onValueChange={(value: boolean) => {
                    if (value) {
                      handleSetupTwoFactor();
                    } else {
                      updateSetting('twoFactorEnabled', false);
                    }
                  }}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            {securitySettings.twoFactorEnabled && (
              <>
                <View style={styles.divider} />
                <SecurityItem
                  icon="backup-restore"
                  title="Backup Codes"
                  description="View or regenerate backup codes"
                  onPress={() => Alert.alert('Info', 'Backup codes feature coming soon')}
                  showChevron
                />
              </>
            )}
          </View>
          <Text style={styles.sectionFooter}>
            Two-factor authentication adds an extra layer of security to your account.
          </Text>
        </View>

        {/* Biometric & Device Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric & Device Security</Text>
          <View style={styles.sectionCard}>
            <SecurityItem
              icon="fingerprint"
              title="Biometric Login"
              description={Platform.OS === 'ios' 
                ? "Use Face ID or Touch ID to sign in" 
                : "Use fingerprint or face unlock to sign in"
              }
              rightComponent={
                <CustomSwitch
                  value={securitySettings.biometricLogin}
                  onValueChange={(value: boolean) => updateSetting('biometricLogin', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            <View style={styles.divider} />
            <SecurityItem
              icon="devices"
              title="Manage Devices"
              description="View and manage devices signed into your account"
              onPress={handleManageDevices}
              showChevron
            />
          </View>
        </View>

        {/* Session & Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session & Activity</Text>
          <View style={styles.sectionCard}>
            <SecurityItem
              icon="timer"
              title="Session Timeout"
              description="Automatically sign out after inactivity"
              rightComponent={
                <Text style={styles.valueText}>{securitySettings.sessionTimeout} min</Text>
              }
            />
            <View style={styles.divider} />
            <SecurityItem
              icon="bell-alert"
              title="Login Alerts"
              description="Get notified of new sign-ins"
              rightComponent={
                <CustomSwitch
                  value={securitySettings.loginAlerts}
                  onValueChange={(value: boolean) => updateSetting('loginAlerts', value)}
                  trackColor={{
                    false: Theme.colors.content.backgroundSubtle,
                    true: Theme.colors.accent.primary,
                  }}
                />
              }
            />
            <View style={styles.divider} />
            <SecurityItem
              icon="history"
              title="Login History"
              description="View recent account activity"
              onPress={handleViewLoginHistory}
              showChevron
            />
          </View>
        </View>

        {/* Emergency Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Options</Text>
          <View style={styles.sectionCard}>
            <SecurityItem
              icon="lock-reset"
              title="Reset Security Settings"
              description="Reset all security settings to defaults"
              onPress={() => Alert.alert(
                'Reset Security Settings',
                'This will reset all your security preferences. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive' },
                ]
              )}
            />
          </View>
          <Text style={styles.sectionFooter}>
            Emergency options should only be used if you're locked out of your account.
          </Text>
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
  securityItem: {
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
  statusText: {
    fontSize: 14,
    color: Theme.colors.semantic.success,
    fontWeight: '500',
    marginRight: 8,
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

export default SecuritySettings; 