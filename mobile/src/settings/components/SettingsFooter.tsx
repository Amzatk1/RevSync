import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Theme } from '../../styles/theme';
import { AppInfo } from '../types';

interface SettingsFooterProps {
  appInfo: AppInfo;
  onDeleteAccount: () => void;
  onSignOut: () => void;
}

const SettingsFooter: React.FC<SettingsFooterProps> = ({
  appInfo,
  onDeleteAccount,
  onSignOut,
}) => {
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteAccount,
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'default',
          onPress: onSignOut,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteAccount}
          accessibilityLabel="Delete account"
          accessibilityRole="button"
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.signOutButton]}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          RevSync v{appInfo.version} ({appInfo.buildNumber})
        </Text>
        <Text style={styles.buildInfo}>
          Released {appInfo.releaseDate} • {appInfo.platform}
        </Text>
        <Text style={styles.deviceInfo}>
          {appInfo.deviceInfo.model} • {appInfo.deviceInfo.os} {appInfo.deviceInfo.osVersion}
        </Text>
      </View>

      {/* Copyright */}
      <Text style={styles.copyright}>
        © 2025 RevSync. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteButton: {
    backgroundColor: Theme.colors.semantic.error,
  },
  signOutButton: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.content.secondary,
    marginBottom: 4,
  },
  buildInfo: {
    fontSize: 13,
    color: Theme.colors.content.tertiary,
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: 12,
    color: Theme.colors.content.tertiary,
  },
  copyright: {
    fontSize: 12,
    color: Theme.colors.content.tertiary,
    textAlign: 'center',
  },
});

export default SettingsFooter; 