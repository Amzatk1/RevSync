import React, { useRef } from "react";
import { View, TouchableOpacity, Platform, type ViewStyle } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { AwardWinningTheme } from "../../styles/awardWinningTheme";

export interface IntelligentCardProps {
  // Content
  children: React.ReactNode;

  // Behavior
  onPress?: () => void;
  onLongPress?: () => void;
  pressable?: boolean;
  haptic?: boolean;

  // Award-winning features
  bloomEnabled?: boolean;
  momentumEnabled?: boolean;
  gestureEnabled?: boolean;
  adaptiveGlass?: boolean;

  // Card variants with fluid scaling
  variant?: "minimal" | "elevated" | "hero" | "floating";

  // Context-aware glass - Intelligent adaptation
  glassType?:
    | "none"
    | "subtle"
    | "medium"
    | "textHeavy"
    | "adaptDark"
    | "adaptLight";
  textContent?: boolean; // Reduces blur automatically

  // Content spacing - Device adaptive
  contentPadding?: keyof typeof AwardWinningTheme.spacing.content;
  spacing?: keyof typeof AwardWinningTheme.spacing;

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
const AnimatedPanGestureHandler =
  Animated.createAnimatedComponent(PanGestureHandler);

export const IntelligentCard: React.FC<IntelligentCardProps> = ({
  children,
  onPress,
  onLongPress,
  pressable = !!onPress,
  haptic = true,
  bloomEnabled = true,
  momentumEnabled = true,
  gestureEnabled = true,
  adaptiveGlass = true,
  variant = "elevated",
  glassType = "none",
  textContent = false,
  contentPadding = "cardInner",
  spacing = "base",
  fullWidth = false,
  aspectRatio,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
}) => {
  const theme = AwardWinningTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Animation values for award-winning interactions
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  // Bloom effect values
  const bloomScale = useSharedValue(0);
  const bloomOpacity = useSharedValue(0);

  // Touch position for bloom origin
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  // Handle intelligent press with bloom and momentum
  const handlePress = async (event?: any) => {
    if (!onPress) return;

    // Capture touch position for bloom origin
    if (event && bloomEnabled) {
      touchX.value = event.nativeEvent.locationX;
      touchY.value = event.nativeEvent.locationY;
    }

    // Bloom animation with haptic sync
    if (bloomEnabled) {
      bloomScale.value = withTiming(1, {
        duration: theme.animations.bloom.duration,
      });
      bloomOpacity.value = withTiming(
        theme.animations.bloom.initialOpacity,
        { duration: theme.animations.bloom.duration / 2 },
        () => {
          bloomOpacity.value = withTiming(theme.animations.bloom.finalOpacity, {
            duration: theme.animations.bloom.duration / 2,
          });
        }
      );
    }

    // Haptic feedback synced with bloom
    if (haptic) {
      if (isIOS) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await Haptics.selectionAsync();
      }
    }

    onPress();
  };

  // Advanced micro-interaction animations
  const handlePressIn = (event?: any) => {
    if (!pressable) return;

    // Capture touch position
    if (event && bloomEnabled) {
      touchX.value = event.nativeEvent.locationX;
      touchY.value = event.nativeEvent.locationY;
    }

    // Award-winning press animation
    scale.value = withSpring(
      theme.animations.presets.cardPress.scale,
      theme.animations.spring.snappy
    );

    if (momentumEnabled) {
      // Add subtle rotation for momentum feel
      rotateZ.value = withSpring(
        interpolate(Math.random(), [0, 1], [-0.5, 0.5]),
        theme.animations.spring.gentle
      );
    }

    opacity.value = withTiming(0.95, {
      duration: theme.animations.duration.micro,
    });

    // Initialize bloom
    if (bloomEnabled) {
      bloomScale.value = 0;
      bloomOpacity.value = 0;
    }
  };

  const handlePressOut = () => {
    if (!pressable) return;

    // Spring back with momentum
    scale.value = withSpring(1, theme.animations.spring.gentle);
    rotateZ.value = withSpring(0, theme.animations.spring.gentle);
    opacity.value = withTiming(1, {
      duration: theme.animations.duration.fast,
    });
  };

  // Gesture handler for swipe interactions
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (!gestureEnabled) return;

      // Apply resistance for rubberband effect
      const resistance = theme.animations.presets.scrollMomentum.resistance;
      translateX.value = context.startX + event.translationX * resistance;
      translateY.value = context.startY + event.translationY * resistance;
    },
    onEnd: (event) => {
      if (!gestureEnabled) return;

      // Check for swipe dismissal
      const velocity = Math.abs(event.velocityX) + Math.abs(event.velocityY);
      const distance = Math.abs(translateX.value) + Math.abs(translateY.value);

      if (
        velocity > theme.animations.presets.swipeDismiss.velocity ||
        distance > 50
      ) {
        // Swipe to reveal or dismiss
        if (onLongPress) {
          runOnJS(onLongPress)();
        }
      }

      // Spring back with momentum
      translateX.value = withSpring(0, theme.animations.spring.momentum);
      translateY.value = withSpring(0, theme.animations.spring.momentum);
    },
  });

  // Get intelligent glass blur intensity
  const getIntelligentBlurIntensity = (): number => {
    if (glassType === "none" || !isIOS) return 0;

    // Context-aware adaptation
    if (textContent || glassType === "textHeavy") {
      return theme.colors.glass.intensity.textHeavy;
    }

    if (adaptiveGlass) {
      if (glassType === "adaptDark" && theme.isDark) {
        return theme.colors.glass.intensity.medium;
      }
      if (glassType === "adaptLight" && !theme.isDark) {
        return theme.colors.glass.intensity.medium;
      }
    }

    switch (glassType) {
      case "subtle":
        return theme.colors.glass.intensity.subtle;
      case "medium":
        return theme.colors.glass.intensity.medium;
      default:
        return 0;
    }
  };

  // Get intelligent glass background
  const getIntelligentGlassBackground = (): string => {
    if (textContent) {
      return theme.isDark
        ? theme.colors.glass.modal.textHeavy
        : theme.colors.glass.modal.textHeavy;
    }

    switch (glassType) {
      case "adaptDark":
        return theme.colors.glass.modal.default;
      case "adaptLight":
        return theme.colors.glass.modal.default;
      default:
        return theme.colors.glass.modal.default;
    }
  };

  // Get adaptive card styles with fluid scaling
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.device.isTablet ? 16 : 12, // Fluid border radius
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
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        };

      case "hero":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          borderRadius: theme.device.isTablet ? 24 : 20,
          minHeight: theme.device.isTablet ? 240 : 200,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        };

      case "floating":
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
          borderRadius: theme.device.isTablet ? 20 : 16,
          marginHorizontal: theme.spacing.sm,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };

      default:
        return {
          ...baseStyle,
          backgroundColor: colors.content.backgroundElevated,
        };
    }
  };

  // Animated styles with momentum physics
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // Bloom effect animated style
  const bloomStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: touchX.value - 50,
    top: touchY.value - 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bloom.primary,
    transform: [{ scale: bloomScale.value }],
    opacity: bloomOpacity.value,
    pointerEvents: "none",
  }));

  // Get adaptive content padding
  const getContentPadding = () => theme.spacing.content[contentPadding];

  // Render content with intelligent glass
  const renderCardContent = () => {
    const content = (
      <View
        style={{
          flex: 1,
          padding: getContentPadding(),
          backgroundColor:
            getIntelligentBlurIntensity() > 0 ? "transparent" : undefined,
        }}
      >
        {children}

        {/* Bloom effect overlay */}
        {bloomEnabled && <Animated.View style={bloomStyle} />}
      </View>
    );

    // Apply intelligent glass effect
    if (getIntelligentBlurIntensity() > 0) {
      return (
        <BlurView
          style={{
            flex: 1,
            borderRadius: theme.device.isTablet ? 16 : 12,
            backgroundColor: getIntelligentGlassBackground(),
          }}
          intensity={getIntelligentBlurIntensity()}
          tint={theme.isDark ? "dark" : "light"}
        >
          {content}
        </BlurView>
      );
    }

    return content;
  };

  // Common props
  const commonProps = {
    style: [getCardStyle(), animatedStyle, style],
    accessibilityLabel,
    accessibilityHint,
  };

  // Render with gesture support
  if (gestureEnabled && (pressable || onLongPress)) {
    return (
      <AnimatedPanGestureHandler onGestureEvent={gestureHandler}>
        <AnimatedTouchableOpacity
          {...commonProps}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={onLongPress}
          activeOpacity={0.98}
          accessibilityRole={accessibilityRole}
        >
          {renderCardContent()}
        </AnimatedTouchableOpacity>
      </AnimatedPanGestureHandler>
    );
  }

  // Standard pressable card
  if (pressable && onPress) {
    return (
      <AnimatedTouchableOpacity
        {...commonProps}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={0.98}
        accessibilityRole={accessibilityRole}
      >
        {renderCardContent()}
      </AnimatedTouchableOpacity>
    );
  }

  // Static card
  return (
    <AnimatedView {...commonProps} accessibilityRole="none">
      {renderCardContent()}
    </AnimatedView>
  );
};

export default IntelligentCard;
