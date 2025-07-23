import React from "react";
import { View, TouchableOpacity, Platform, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { RefinedMinimalistTheme } from "../../styles/refinedMinimalistTheme";

export interface ContentCardProps {
  // Content
  children: React.ReactNode;

  // Behavior
  onPress?: () => void;
  pressable?: boolean;
  haptic?: boolean;

  // Card variants - Content-first philosophy
  variant?: "minimal" | "elevated" | "hero" | "floating";

  // Glass configuration - Controlled, not overbearing
  glassType?: "none" | "subtle" | "medium";
  respectsReduceTransparency?: boolean;

  // Content spacing - 3:1 whitespace ratio
  contentPadding?: keyof typeof RefinedMinimalistTheme.spacing.content;
  spacing?: keyof typeof RefinedMinimalistTheme.spacing;

  // Layout
  fullWidth?: boolean;
  aspectRatio?: number;

  // Custom styling
  style?: ViewStyle;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: "button" | "none";
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const ContentCard: React.FC<ContentCardProps> = ({
  children,
  onPress,
  pressable = !!onPress,
  haptic = true,
  variant = "elevated",
  glassType = "none", // Conservative default - no glass unless explicitly requested
  respectsReduceTransparency = true,
  contentPadding = "cardInner",
  spacing = "base",
  fullWidth = false,
  aspectRatio,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const theme = RefinedMinimalistTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Handle press with subtle micro-interactions
  const handlePress = async () => {
    if (!onPress) return;

    // Haptic feedback - Very subtle for content cards
    if (haptic) {
      if (isIOS) {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    onPress();
  };

  // Micro-interaction animations - Instagram/Twitter level
  const handlePressIn = () => {
    if (pressable) {
      scale.value = withTiming(theme.animations.presets.cardPress.scale, {
        duration: theme.animations.duration.micro,
      });
      opacity.value = withTiming(0.96, {
        duration: theme.animations.duration.micro,
      });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, theme.animations.spring.gentle);
      opacity.value = withTiming(1, {
        duration: theme.animations.duration.fast,
      });
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get glass blur intensity - Conservative approach
  const getBlurIntensity = (): number => {
    if (glassType === "none" || !isIOS || theme.glass.reduceTransparency) {
      return 0; // No glass effect
    }

    switch (glassType) {
      case "subtle":
        return theme.glass.subtle;
      case "medium":
        return theme.glass.medium;
      default:
        return 0;
    }
  };

  // Get card styles based on variant
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.base,
      overflow: "hidden",
      ...(fullWidth && { width: "100%" }),
      ...(aspectRatio && { aspectRatio }),
      marginBottom: theme.spacing[spacing],
    };

    switch (variant) {
      case "minimal":
        return {
          ...baseStyle,
          backgroundColor: colors.content.background,
          borderWidth: 1,
          borderColor: colors.content.border,
        };

      case "elevated":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          ...theme.shadows.subtle,
        };

      case "hero":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          borderRadius: theme.borderRadius.xl,
          minHeight: 200,
          ...theme.shadows.medium,
        };

      case "floating":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          borderRadius: theme.borderRadius.lg,
          marginHorizontal: theme.spacing.sm,
          ...theme.shadows.soft,
        };

      default:
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
        };
    }
  };

  // Get content padding - 3:1 whitespace ratio
  const getContentPadding = () => theme.spacing.content[contentPadding];

  // Render content with optional glass effect
  const renderCardContent = () => {
    const content = (
      <View
        style={{
          flex: 1,
          padding: getContentPadding(),
          backgroundColor: getBlurIntensity() > 0 ? "transparent" : undefined,
        }}
      >
        {children}
      </View>
    );

    // Apply glass effect only if requested and supported
    if (getBlurIntensity() > 0) {
      return (
        <BlurView
          style={{ flex: 1, borderRadius: theme.borderRadius.base }}
          intensity={getBlurIntensity()}
          tint={theme.isDark ? "dark" : "light"}
        >
          {content}
        </BlurView>
      );
    }

    return content;
  };

  // Common props for both pressable and non-pressable cards
  const commonProps = {
    style: [getCardStyle(), animatedStyle, style],
    accessibilityLabel,
    accessibilityHint,
  };

  if (pressable && onPress) {
    return (
      <AnimatedTouchableOpacity
        {...commonProps}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.98}
        accessibilityRole={accessibilityRole}
      >
        {renderCardContent()}
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedView {...commonProps} accessibilityRole="none">
      {renderCardContent()}
    </AnimatedView>
  );
};

export default ContentCard;
