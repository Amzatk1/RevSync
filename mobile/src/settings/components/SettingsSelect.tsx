import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';
import { SettingsItem } from '../types';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface SettingsSelectProps {
  item: SettingsItem;
  isLastItem: boolean;
}

const SettingsSelect: React.FC<SettingsSelectProps> = ({ item, isLastItem }) => {
  const [showOptions, setShowOptions] = useState(false);

  const selectedOption = item.options?.find(option => option.value === item.value);

  const handleSelect = (value: any) => {
    item.onChange?.(value);
    setShowOptions(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.itemRow, isLastItem && styles.lastItemRow]}
        onPress={() => setShowOptions(true)}
        accessibilityLabel={`${item.label}: ${selectedOption?.label || 'Not selected'}`}
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
          <Text style={styles.itemValue}>
            {selectedOption?.label || 'Select'}
          </Text>
          <TypedIcon
            name="chevron-right"
            size={20}
            color={Theme.colors.content.tertiary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOptions(false)}
              >
                <TypedIcon
                  name="close"
                  size={24}
                  color={Theme.colors.content.secondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {item.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionRow,
                    option.value === item.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    option.value === item.value && styles.selectedOptionText,
                  ]}>
                    {option.label}
                  </Text>
                  {option.value === item.value && (
                    <TypedIcon
                      name="check"
                      size={20}
                      color={Theme.colors.accent.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.content.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.content.primary,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  selectedOption: {
    backgroundColor: `${Theme.colors.accent.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: Theme.colors.content.primary,
  },
  selectedOptionText: {
    color: Theme.colors.accent.primary,
    fontWeight: '600',
  },
});

export default SettingsSelect; 