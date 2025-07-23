import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { RefinedMinimalistTheme } from "../../styles/refinedMinimalistTheme";

export interface SocialTab {
  id: string;
  icon: React.ReactNode;
  iconActive?: React.ReactNode;
  label?: string;
  badge?: number | string;
  accessibilityLabel?: string;
}

export interface SocialNavigationProps {
  // Navigation data
  tabs: SocialTab[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;

  // Appearance - Instagram/Twitter inspired
  variant?: "minimal" | "glass" | "floating";
  showLabels?: boolean;
  showIndicator?: boolean;

  // Glass configuration - Controlled
  glassType?: "subtle" | "medium";
  respectsReduceTransparency?: boolean;

  // Layout
  safeArea?: boolean;

  // Haptic feedback
  haptic?: boolean;

  // Custom styling
  style?: ViewStyle;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const SocialNavigation: React.FC<SocialNavigationProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  variant = "glass",
  showLabels = false, // Instagram/Twitter don't show labels by default
  showIndicator = true,
  glassType = "subtle",
  respectsReduceTransparency = true,
  safeArea = true,
  haptic = true,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const theme = RefinedMinimalistTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Get glass blur intensity - Conservative approach
  const getBlurIntensity = (): number => {
    if (!isIOS || theme.glass.reduceTransparency) {
      return 0; // Fallback to solid background
    }

    switch (glassType) {
      case "subtle":
        return theme.glass.subtle;
      case "medium":
        return theme.glass.medium;
      default:
        return theme.glass.subtle;
    }
  };

  // Handle tab press with micro-interactions
  const handleTabPress = async (tabId: string) => {
    if (tabId === activeTabId) return; // Don't trigger if already active

    // Haptic feedback - Very subtle for social apps
    if (haptic) {
      if (isIOS) {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    onTabPress(tabId);
  };

  // Get navigation container styles
  const getNavigationStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.base,
      paddingTop: theme.spacing.sm,
      paddingBottom: safeArea
        ? Math.max(insets.bottom, theme.spacing.sm)
        : theme.spacing.sm,
      height: theme.spacing.nav.tabHeight + (safeArea ? insets.bottom : 0),
    };

    switch (variant) {
      case "minimal":
        return {
          ...baseStyle,
          backgroundColor: colors.content.background,
          borderTopWidth: 1,
          borderTopColor: colors.content.divider,
        };

      case "glass":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
        };

      case "floating":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          marginHorizontal: theme.spacing.base,
          marginBottom: safeArea
            ? insets.bottom + theme.spacing.sm
            : theme.spacing.sm,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.soft,
        };

      default:
        return baseStyle;
    }
  };

  // Render navigation content
  const renderNavigationContent = () => (
    <View style={getNavigationStyle()}>
      {tabs.map((tab, index) => (
        <SocialTabButton
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onPress={() => handleTabPress(tab.id)}
          showLabel={showLabels}
          showIndicator={showIndicator}
          flex={1 / tabs.length}
        />
      ))}
    </View>
  );

  // Render with glass effect for iOS
  if (variant === "glass" && isIOS && getBlurIntensity() > 0) {
    return (
      <View style={[{ backgroundColor: "transparent" }, style]}>
        <BlurView
          style={{
            borderTopLeftRadius:
              variant === "floating" ? theme.borderRadius.xl : 0,
            borderTopRightRadius:
              variant === "floating" ? theme.borderRadius.xl : 0,
            overflow: "hidden",
          }}
          intensity={getBlurIntensity()}
          tint={theme.isDark ? "dark" : "light"}
        >
          {renderNavigationContent()}
        </BlurView>
      </View>
    );
  }

  // Fallback to solid background
  return (
    <View
      style={[
        getNavigationStyle(),
        {
          backgroundColor:
            variant === "glass"
              ? colors.glass.nav
              : variant === "floating"
              ? colors.content.backgroundElevated
              : colors.content.background,
        },
        style,
      ]}
    >
      {tabs.map((tab, index) => (
        <SocialTabButton
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onPress={() => handleTabPress(tab.id)}
          showLabel={showLabels}
          showIndicator={showIndicator}
          flex={1 / tabs.length}
        />
      ))}
    </View>
  );
};

// Individual Social Tab Button Component
interface SocialTabButtonProps {
  tab: SocialTab;
  isActive: boolean;
  onPress: () => void;
  showLabel: boolean;
  showIndicator: boolean;
  flex: number;
}

const SocialTabButton: React.FC<SocialTabButtonProps> = ({
  tab,
  isActive,
  onPress,
  showLabel,
  showIndicator,
  flex,
}) => {
  const scale = useSharedValue(1);
  const indicatorScale = useSharedValue(isActive ? 1 : 0);
  const iconOpacity = useSharedValue(isActive ? 1 : 0.6);

  const theme = RefinedMinimalistTheme;
  const colors = theme.colors;

  // Update animations when active state changes
  React.useEffect(() => {
    iconOpacity.value = withTiming(isActive ? 1 : 0.6, {
      duration: theme.animations.duration.fast,
    });

    indicatorScale.value = withSpring(
      isActive ? 1 : 0,
      theme.animations.spring.snappy
    );
  }, [isActive, iconOpacity, indicatorScale, theme.animations]);

  // Handle press animations - Instagram-style subtle feedback
  const handlePressIn = () => {
    scale.value = withTiming(0.95, {
      duration: theme.animations.duration.micro,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animations.spring.gentle);
  };

  // Animated styles
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: iconOpacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
    opacity: interpolate(indicatorScale.value, [0, 1], [0, 1]),
  }));

  return (
    <AnimatedTouchableOpacity
      style={[
        {
          flex,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.xs,
          minHeight: 48, // WCAG AA touch target
          position: "relative",
        },
        buttonStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        tab.accessibilityLabel || tab.label || `Tab ${tab.id}`
      }
      accessibilityState={{ selected: isActive }}
    >
      {/* Active indicator - Instagram-style dot */}
      {showIndicator && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 4,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.accent.primary,
            },
            indicatorStyle,
          ]}
        />
      )}

      {/* Tab Icon */}
      <View style={{ position: "relative" }}>
        {isActive && tab.iconActive ? tab.iconActive : tab.icon}

        {/* Badge - Instagram/Twitter style */}
        {tab.badge && (
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.semantic.error,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {typeof tab.badge === "number" && tab.badge > 9
                ? "9+"
                : tab.badge}
            </Text>
          </View>
        )}
      </View>

      {/* Tab Label - Only if explicitly shown */}
      {showLabel && tab.label && (
        <Text
          style={{
            marginTop: theme.spacing.xxxs,
            fontSize: 10,
            fontWeight: isActive ? "600" : "400",
            color: isActive ? colors.accent.primary : colors.content.tertiary,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

export default SocialNavigation;
