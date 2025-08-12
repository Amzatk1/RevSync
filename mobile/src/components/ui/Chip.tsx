import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
const TypedIcon: any = Icon;
import { Theme } from '../../styles/theme';

export type ChipVariant = 'filled' | 'outline';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  leftIconName?: string; // MaterialCommunityIcons name
  style?: ViewStyle;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = 'outline',
  leftIconName,
  style,
}) => {
  const isFilled = selected || variant === 'filled';
  const backgroundColor = isFilled ? Theme.colors.accent.primary : Theme.colors.content.background;
  const borderColor = isFilled ? Theme.colors.accent.primary : Theme.colors.content.border;
  const textColor = isFilled ? '#FFFFFF' : Theme.colors.content.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor, borderColor }, style]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <View style={styles.row}>
        {leftIconName ? <TypedIcon name={leftIconName as any} size={14} color={textColor} style={{ marginRight: 6 }} /> : null}
        <Text style={[styles.text, { color: textColor }]} allowFontScaling>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Chip;


