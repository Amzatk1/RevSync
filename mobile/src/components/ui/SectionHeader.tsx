import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../styles/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle} allowFontScaling>{subtitle}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.content.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.content.primarySecondary,
  },
});

export default SectionHeader;


