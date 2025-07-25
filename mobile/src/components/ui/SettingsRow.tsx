import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Theme } from "../../styles/theme";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
// import { BlurView } from "expo-blur"; // Disabled due to linter error

interface SettingsRowProps {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  glass?: boolean; // Enable Liquid Glass accent
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  right,
  onPress,
  disabled,
  accessibilityLabel,
  glass,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10 });
    opacity.value = withTiming(0.92, { duration: 80 });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 120 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const content = (
    <Animated.View style={[styles.row, animatedStyle, disabled && { opacity: 0.5 }]} pointerEvents={disabled ? "none" : "auto"}>
      <Text
        style={[
          Theme.typography.ios.bodyLarge,
          { color: Theme.colors.content.primary, flex: 1 },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {right && <View style={styles.right}>{right}</View>}
    </Animated.View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel || label}
      activeOpacity={onPress ? 0.7 : 1}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      style={{ borderRadius: Theme.spacing.sm, overflow: glass ? "hidden" : "visible" }}
    >
      {/*
      // Liquid Glass effect disabled due to BlurView linter error. Uncomment and fix if BlurView is supported in your setup.
      {glass && Platform.OS === "ios" ? (
        <BlurView intensity={16} tint="light" style={StyleSheet.absoluteFill as any} />
      ) : glass ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Theme.colors.content.backgroundElevated, opacity: 0.7, borderRadius: Theme.spacing.sm }]} />
      ) : null}
      */}
      {glass ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Theme.colors.content.backgroundElevated, opacity: 0.7, borderRadius: Theme.spacing.sm }]} />
      ) : null}
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingVertical: Theme.spacing.base,
    paddingHorizontal: Theme.spacing.base,
    backgroundColor: "transparent",
    borderRadius: Theme.spacing.sm,
  },
  right: {
    marginLeft: Theme.spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SettingsRow;
