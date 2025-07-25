import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';
import { SettingsToggle } from '../types';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface QuickTogglesProps {
  toggles: SettingsToggle[];
}

const QuickToggles: React.FC<QuickTogglesProps> = ({ toggles }) => {
  return (
    <View style={styles.container}>
      {toggles.map((toggle, index) => (
        <TouchableOpacity
          key={toggle.id}
          style={[
            styles.toggleRow,
            index === toggles.length - 1 && styles.lastToggleRow,
          ]}
          onPress={() => toggle.onChange(!toggle.value)}
          accessibilityLabel={`${toggle.label}${toggle.value ? ' on' : ' off'}`}
          accessibilityRole="switch"
          accessibilityState={{ checked: toggle.value }}
        >
          <View style={styles.toggleLeft}>
            <View style={[
              styles.iconContainer,
              toggle.value && styles.iconContainerActive
            ]}>
              <TypedIcon
                name={toggle.icon}
                size={20}
                color={toggle.value ? '#FFFFFF' : Theme.colors.content.secondary}
              />
            </View>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>{toggle.label}</Text>
              {toggle.description && (
                <Text style={styles.toggleDescription}>
                  {toggle.description}
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={toggle.value}
            onValueChange={toggle.onChange}
            trackColor={{
              false: Theme.colors.content.backgroundSubtle,
              true: Theme.colors.accent.primary,
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            ios_backgroundColor={Theme.colors.content.backgroundSubtle}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  lastToggleRow: {
    borderBottomWidth: 0,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.colors.content.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: Theme.colors.accent.primary,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: Theme.colors.content.secondary,
    lineHeight: 18,
  },
});

export default QuickToggles; 