import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
const TypedIcon: any = Icon;
import { Theme } from '../../styles/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <TypedIcon name={icon as any} size={36} color={Theme.colors.content.primarySecondary} />
      <Text style={styles.title} allowFontScaling>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} allowFontScaling>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.content.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Theme.colors.content.primarySecondary,
    textAlign: 'center',
  },
});

export default EmptyState;


