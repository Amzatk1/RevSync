import React, { useCallback, memo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Theme } from "../../styles/theme";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
const AView: any = (Animated as any).View;
import * as Haptics from "expo-haptics";
// import { BlurView } from "expo-blur"; // Disabled due to linter error
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

interface SettingsRowProps {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  glass?: boolean; // Enable Liquid Glass accent
  subtitle?: string;
  left?: React.ReactNode;
  showChevron?: boolean;
  testID?: string;
  glassIntensity?: number; // 0..1 for fallback tint opacity
  glassTint?: "light" | "dark";
  accessibilityHint?: string;
  onLongPress?: () => void;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  subtitle,
  left,
  right,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  showChevron,
  glass,
  glassIntensity = 0.7,
  glassTint,
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!onPress || disabled) return;
    scale.value = withSpring(0.97, { damping: 10 });
    opacity.value = withTiming(0.92, { duration: 80 });
    if (Platform.OS !== "web") {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
  }, [onPress, disabled]);

  const handlePressOut = useCallback(() => {
    if (!onPress || disabled) return;
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 120 });
  }, [onPress, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const content = (
    <AView
      style={[styles.row, animatedStyle, disabled && { opacity: 0.5 }]}
      pointerEvents={disabled ? "none" : "auto"}
    >
      {left ? <View style={styles.left}>{left}</View> : null}

      <View style={{ flex: 1 }}>
        <Text
          style={[
            Theme.typography.ios.bodyLarge,
            { color: Theme.colors.content.primary },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
          allowFontScaling
        >
          {label}
        </Text>

        {subtitle ? (
          <Text
            style={[
              Theme.typography.ios.bodyMedium,
              { color: Theme.colors.content.primarySecondary, marginTop: 2 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
            allowFontScaling
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        <View style={styles.right}>{right}</View>
      ) : showChevron ? (
        <View style={styles.right}>
          {(Icon as any)({
            name: "chevron-right",
            size: 20,
            color: Theme.colors.content.primarySecondary,
            accessibilityElementsHidden: true,
            importantForAccessibility: "no",
          })}
        </View>
      ) : null}
    </AView>
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      accessible
      importantForAccessibility="yes"
      android_ripple={
        Platform.OS === "android" && onPress
          ? { color: Theme.colors.content.primarySecondary, borderless: false }
          : undefined
      }
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      style={{ borderRadius: Theme.spacing.sm, overflow: glass ? "hidden" : "visible" }}
    >
      {/*
      // Liquid Glass effect disabled due to BlurView linter error. Uncomment and fix if BlurView is supported in your setup.
      {glass && Platform.OS === "ios" ? (
        <BlurView intensity={16} tint={glassTint || "light"} style={StyleSheet.absoluteFill as any} />
      ) : glass ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Theme.colors.content.backgroundElevated, opacity: glassIntensity, borderRadius: Theme.spacing.sm }]} />
      ) : null}
      */}
      {glass ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: Theme.colors.content.backgroundElevated,
              opacity: glassIntensity,
              borderRadius: Theme.spacing.sm,
            },
          ]}
        />
      ) : null}
      {content}
    </Pressable>
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
  left: {
    marginRight: Theme.spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(SettingsRow);
