import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../styles/theme';

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ label, color, style }) => {
  return (
    <View style={[styles.badge, { backgroundColor: color || Theme.colors.semantic.info }, style]}>
      <Text style={styles.text} allowFontScaling>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Badge;


