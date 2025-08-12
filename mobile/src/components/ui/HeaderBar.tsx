import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
const TypedIcon: any = Icon;
import { Theme } from '../../styles/theme';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  rightIconName?: string;
  onRightPress?: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ title, subtitle, rightIconName, onRightPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={{ width: 24 }} />
        <View style={styles.center}>
          <Text style={styles.title} allowFontScaling>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} allowFontScaling>{subtitle}</Text> : null}
        </View>
        {rightIconName ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={rightIconName}>
            <TypedIcon name={rightIconName as any} size={24} color={Theme.colors.content.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Theme.colors.content.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.content.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
});

export default HeaderBar;


