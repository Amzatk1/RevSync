import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';
import { SettingsSection as SettingsSectionType } from '../types';
import SettingsSlider from './SettingsSlider';
import SettingsSelect from './SettingsSelect';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface SettingsSectionProps {
  section: SettingsSectionType;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ section }) => {
  const renderSettingsItem = (item: any, index: number) => {
    const isLastItem = index === section.items.length - 1;

    switch (item.type) {
      case 'toggle':
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, isLastItem && styles.lastItemRow]}
            onPress={() => item.onChange?.(!item.value)}
            accessibilityLabel={`${item.label}${item.value ? ' on' : ' off'}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: item.value }}
          >
            <View style={styles.itemLeft}>
              <View style={styles.itemIconContainer}>
                <TypedIcon
                  name={item.icon}
                  size={20}
                  color={Theme.colors.content.secondary}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{
                false: Theme.colors.content.backgroundSubtle,
                true: Theme.colors.accent.primary,
              }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              ios_backgroundColor={Theme.colors.content.backgroundSubtle}
            />
          </TouchableOpacity>
        );

      case 'slider':
        return (
          <View key={item.id} style={[styles.itemRow, isLastItem && styles.lastItemRow]}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIconContainer}>
                <TypedIcon
                  name={item.icon}
                  size={20}
                  color={Theme.colors.content.secondary}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <SettingsSlider
              value={item.value}
              onValueChange={item.onChange}
              minimumValue={item.min || 0}
              maximumValue={item.max || 100}
              step={item.step || 1}
            />
          </View>
        );

      case 'select':
        return (
          <SettingsSelect
            key={item.id}
            item={item}
            isLastItem={isLastItem}
          />
        );

      case 'info':
        return (
          <View key={item.id} style={[styles.itemRow, isLastItem && styles.lastItemRow]}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIconContainer}>
                <TypedIcon
                  name={item.icon}
                  size={20}
                  color={Theme.colors.content.secondary}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            {item.value && (
              <Text style={styles.itemValue}>{item.value}</Text>
            )}
          </View>
        );

      default: // navigation
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, isLastItem && styles.lastItemRow]}
            onPress={item.onPress}
            accessibilityLabel={item.label}
            accessibilityRole="button"
          >
            <View style={styles.itemLeft}>
              <View style={styles.itemIconContainer}>
                <TypedIcon
                  name={item.icon}
                  size={20}
                  color={Theme.colors.content.secondary}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <View style={styles.itemRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <TypedIcon
                name="chevron-right"
                size={20}
                color={Theme.colors.content.tertiary}
              />
            </View>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map(renderSettingsItem)}
      </View>
      {section.footer && (
        <Text style={styles.sectionFooter}>{section.footer}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: Theme.colors.content.primary,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: Theme.colors.content.secondary,
    lineHeight: 18,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    marginRight: 8,
  },
  badge: {
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SettingsSection; 