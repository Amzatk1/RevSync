import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, GestureResponderEvent, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../styles/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  leftIcon,
  rightIcon,
  accessibilityLabel,
}) => {
  const handlePress = async (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onPress?.(e);
  };

  const styles = getStyles(variant, disabled);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? Theme.colors.content.primary : '#fff'} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          <Text style={styles.title} allowFontScaling numberOfLines={1}>
            {title}
          </Text>
          {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

function getStyles(variant: ButtonVariant, disabled: boolean) {
  const base = {
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
  };

  const colorSet = {
    primary: {
      backgroundColor: disabled ? Theme.colors.accent.primaryDisabled : Theme.colors.accent.primary,
      textColor: '#fff',
    },
    secondary: {
      backgroundColor: Theme.colors.content.backgroundElevated,
      textColor: Theme.colors.content.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: Theme.colors.content.primary,
    },
  } as const;

  const c = colorSet[variant];

  return StyleSheet.create({
    button: {
      ...base,
      backgroundColor: c.backgroundColor,
      borderWidth: variant === 'ghost' ? 1 : 0,
      borderColor: variant === 'ghost' ? Theme.colors.content.border : 'transparent',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
        android: { elevation: variant === 'ghost' ? 0 : 2 },
      }),
    },
    title: {
      color: c.textColor,
      fontWeight: '700' as const,
    },
    contentRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  });
}

export default Button;


