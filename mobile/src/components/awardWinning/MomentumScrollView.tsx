import React from "react";
import {
  ScrollView,
  Platform,
  type ScrollViewProps,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AwardWinningTheme } from "../../styles/awardWinningTheme";

export interface MomentumScrollViewProps extends ScrollViewProps {
  // Momentum features
  rubberbandEnabled?: boolean;
  elasticOverscroll?: boolean;
  hapticFeedback?: boolean;

  // Physics configuration
  overshootDistance?: number;
  resistance?: number;
  momentumDecelerationRate?: "normal" | "fast";

  // Callbacks
  onMomentumBegin?: () => void;
  onMomentumEnd?: () => void;
  onOverscrollTop?: () => void;
  onOverscrollBottom?: () => void;

  // Award-winning enhancements
  contentRevealStagger?: boolean;
  intelligentBounce?: boolean;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const MomentumScrollView: React.FC<MomentumScrollViewProps> = ({
  children,
  rubberbandEnabled = true,
  elasticOverscroll = true,
  hapticFeedback = true,
  overshootDistance = 50,
  resistance = 0.25,
  momentumDecelerationRate = "normal",
  onMomentumBegin,
  onMomentumEnd,
  onOverscrollTop,
  onOverscrollBottom,
  contentRevealStagger = true,
  intelligentBounce = true,
  ...scrollViewProps
}) => {
  const theme = AwardWinningTheme;
  const isIOS = Platform.OS === "ios";

  // Scroll physics values
  const scrollY = useSharedValue(0);
  const scrollVelocity = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const hasOverscrolled = useSharedValue(false);

  // Content reveal animation values
  const contentOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

  // Handle haptic feedback for overscroll
  const triggerOverscrollHaptic = async () => {
    if (hapticFeedback && isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Intelligent momentum scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const maxScrollY =
        event.contentSize.height - event.layoutMeasurement.height;

      scrollY.value = currentY;

      // Detect overscroll at top
      if (currentY < -overshootDistance && rubberbandEnabled) {
        if (!hasOverscrolled.value) {
          hasOverscrolled.value = true;
          runOnJS(triggerOverscrollHaptic)();
          if (onOverscrollTop) {
            runOnJS(onOverscrollTop)();
          }
        }

        // Apply resistance for rubberband effect
        const overscrollAmount = Math.abs(currentY + overshootDistance);
        const resistedOffset = overscrollAmount * resistance;

        if (elasticOverscroll) {
          contentScale.value = withSpring(
            1 + resistedOffset / 1000, // Subtle scale increase
            theme.animations.spring.elastic
          );
        }
      }

      // Detect overscroll at bottom
      else if (currentY > maxScrollY + overshootDistance && rubberbandEnabled) {
        if (!hasOverscrolled.value) {
          hasOverscrolled.value = true;
          runOnJS(triggerOverscrollHaptic)();
          if (onOverscrollBottom) {
            runOnJS(onOverscrollBottom)();
          }
        }

        const overscrollAmount = currentY - (maxScrollY + overshootDistance);
        const resistedOffset = overscrollAmount * resistance;

        if (elasticOverscroll) {
          contentScale.value = withSpring(
            1 + resistedOffset / 1000,
            theme.animations.spring.elastic
          );
        }
      }

      // Reset overscroll state when back in bounds
      else if (hasOverscrolled.value) {
        hasOverscrolled.value = false;

        if (elasticOverscroll) {
          contentScale.value = withSpring(1, theme.animations.spring.momentum);
        }
      }
    },

    onBeginDrag: () => {
      isScrolling.value = true;

      if (contentRevealStagger) {
        contentOpacity.value = withTiming(0.95, {
          duration: theme.animations.duration.micro,
        });
      }
    },

    onEndDrag: (event) => {
      scrollVelocity.value = event.velocity?.y || 0;
    },

    onMomentumBegin: () => {
      if (onMomentumBegin) {
        runOnJS(onMomentumBegin)();
      }

      // Intelligent bounce based on velocity
      if (intelligentBounce && Math.abs(scrollVelocity.value) > 1000) {
        if (hapticFeedback && isIOS) {
          runOnJS(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          })();
        }
      }
    },

    onMomentumEnd: () => {
      isScrolling.value = false;

      if (onMomentumEnd) {
        runOnJS(onMomentumEnd)();
      }

      // Restore content appearance
      if (contentRevealStagger) {
        contentOpacity.value = withSpring(1, theme.animations.spring.gentle);
      }

      // Reset physics values
      scrollVelocity.value = 0;
      hasOverscrolled.value = false;

      if (elasticOverscroll) {
        contentScale.value = withSpring(1, theme.animations.spring.momentum);
      }
    },
  });

  // Content animation styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  // Enhanced scroll view props with momentum physics
  const enhancedProps = {
    ...scrollViewProps,
    onScroll: scrollHandler,
    scrollEventThrottle: 16, // Smooth 60fps
    decelerationRate: momentumDecelerationRate,

    // iOS-specific momentum enhancements
    ...(isIOS && {
      alwaysBounceVertical: rubberbandEnabled,
      bounces: rubberbandEnabled,
      bouncesZoom: false,
      automaticallyAdjustContentInsets: false,
      scrollIndicatorInsets: { right: 1 },
    }),

    // Android-specific enhancements
    ...(Platform.OS === "android" && {
      nestedScrollEnabled: true,
      overScrollMode: rubberbandEnabled ? "always" : "never",
    }),
  };

  return (
    <AnimatedScrollView {...enhancedProps}>
      <Animated.View style={contentStyle}>{children}</Animated.View>
    </AnimatedScrollView>
  );
};

export default MomentumScrollView;
