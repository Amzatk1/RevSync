import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  Pressable,
  AccessibilityInfo,
  type ViewStyle,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Theme } from "../../styles/theme";

export interface GestureModalProps {
  // Content
  children: React.ReactNode;
  title?: string;
  subtitle?: string;

  // Behavior
  visible: boolean;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  haptic?: boolean;

  // Award-winning features
  gestureEnabled?: boolean;
  momentumReveal?: boolean;
  intelligentGlass?: boolean;
  bloomFeedback?: boolean;

  // Modal variants with fluid adaptation
  variant?: "sheet" | "center" | "fullscreen" | "hero";

  // Context-aware glass - Intelligent adaptation
  glassType?:
    | "none"
    | "subtle"
    | "medium"
    | "textHeavy"
    | "adaptDark"
    | "adaptLight";
  textContent?: boolean;

  // Content spacing - Device adaptive
  contentPadding?: keyof typeof Theme.spacing.content;

  // Gesture configuration
  swipeThreshold?: number;
  velocityThreshold?: number;
  gestureArea?: "full" | "edge" | "handle";

  // Accessibility
  accessibilityLabel?: string;
  accessibilityRole?: "dialog" | "alertdialog";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedPanGestureHandler =
  Animated.createAnimatedComponent(PanGestureHandler);

export const GestureModal: React.FC<GestureModalProps> = ({
  children,
  title,
  subtitle,
  visible,
  onClose,
  closeOnBackdrop = true,
  haptic = true,
  gestureEnabled = true,
  momentumReveal = true,
  intelligentGlass = true,
  bloomFeedback = true,
  variant = "sheet",
  glassType = "medium",
  textContent = false,
  contentPadding = "cardInner",
  swipeThreshold = 0.3,
  velocityThreshold = 500,
  gestureArea = "full",
  accessibilityLabel,
  accessibilityRole = "dialog",
}) => {
  const insets = useSafeAreaInsets();
  const theme = Theme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Animation values for award-winning reveal
  const backdropOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300);
  const modalScale = useSharedValue(0.9);
  const gestureTranslateY = useSharedValue(0);
  const gestureVelocity = useSharedValue(0);

  // Bloom effect values
  const bloomScale = useSharedValue(0);
  const bloomOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Award-winning entrance with momentum
      backdropOpacity.value = withTiming(1, {
        duration: theme.animations.duration.fast,
      });

      if (variant === "sheet") {
        modalTranslateY.value = withSpring(0, theme.animations.spring.bouncy);
      } else {
        modalScale.value = withSpring(1, theme.animations.spring.bouncy);
      }

      // Announce to screen readers
      if (accessibilityLabel) {
        AccessibilityInfo.announceForAccessibility(accessibilityLabel);
      }
    } else {
      // Smooth exit animation
      backdropOpacity.value = withTiming(0, {
        duration: theme.animations.duration.normal,
      });

      if (variant === "sheet") {
        modalTranslateY.value = withTiming(300, {
          duration: theme.animations.duration.normal,
        });
      } else {
        modalScale.value = withTiming(0.9, {
          duration: theme.animations.duration.normal,
        });
      }
    }
  }, [visible]);

  // Intelligent gesture handler with momentum physics
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = gestureTranslateY.value;

      if (haptic && isIOS) {
        runOnJS(async () => {
          await Haptics.selectionAsync();
        })();
      }
    },

    onActive: (event, context) => {
      if (!gestureEnabled) return;

      const newTranslateY = context.startY + event.translationY;

      // Apply resistance for upward swipes
      if (newTranslateY < 0) {
        gestureTranslateY.value =
          newTranslateY * theme.animations.presets.scrollMomentum.resistance;
      } else {
        gestureTranslateY.value = newTranslateY;
      }

      gestureVelocity.value = event.velocityY;

      // Update backdrop opacity based on drag distance
      const dragProgress = Math.max(0, Math.min(1, newTranslateY / 200));
      backdropOpacity.value = 1 - dragProgress * 0.5;
    },

    onEnd: (event) => {
      if (!gestureEnabled) return;

      const shouldDismiss =
        gestureTranslateY.value > 100 * swipeThreshold ||
        event.velocityY > velocityThreshold;

      if (shouldDismiss) {
        // Momentum-based dismissal
        gestureTranslateY.value = withSpring(
          300,
          theme.animations.spring.momentum
        );
        backdropOpacity.value = withTiming(0, {
          duration: theme.animations.duration.fast,
        });

        // Haptic feedback for dismissal
        if (haptic && isIOS) {
          runOnJS(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          })();
        }

        // Close modal after animation
        setTimeout(() => {
          runOnJS(onClose)();
        }, theme.animations.duration.fast);
      } else {
        // Spring back with momentum
        gestureTranslateY.value = withSpring(
          0,
          theme.animations.spring.elastic
        );
        backdropOpacity.value = withTiming(1, {
          duration: theme.animations.duration.fast,
        });
      }
    },
  });

  // Handle backdrop press with bloom effect
  const handleBackdropPress = async (event: any) => {
    if (!closeOnBackdrop) return;

    // Bloom effect at touch location
    if (bloomFeedback) {
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

    if (haptic) {
      await Haptics.selectionAsync();
    }

    onClose();
  };

  // Get intelligent glass blur intensity
  const getIntelligentBlurIntensity = (): number => {
    if (glassType === "none" || !isIOS) return 0;

    // Context-aware adaptation
    if (textContent || glassType === "textHeavy") {
      return theme.colors.glass.intensity.textHeavy;
    }

    if (intelligentGlass) {
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
        return theme.colors.glass.intensity.medium;
    }
  };

  // Get intelligent glass background
  const getIntelligentGlassBackground = (): string => {
    if (textContent) {
      return theme.isDark
        ? theme.colors.glass.modal.textHeavy
        : theme.colors.glass.modal.textHeavy;
    }

    return theme.isDark
      ? theme.colors.glass.modal.default
      : theme.colors.glass.modal.default;
  };

  // Animated styles with momentum physics
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => {
    if (variant === "sheet") {
      return {
        transform: [
          {
            translateY: modalTranslateY.value + gestureTranslateY.value,
          },
        ],
      };
    } else {
      return {
        transform: [{ scale: modalScale.value }],
        opacity: backdropOpacity.value,
      };
    }
  });

  // Bloom effect style
  const bloomStyle = useAnimatedStyle(() => ({
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.bloom.secondary,
    transform: [{ scale: bloomScale.value }],
    opacity: bloomOpacity.value,
    pointerEvents: "none",
  }));

  // Get modal container styles with fluid adaptation
  const getModalContainerStyle = (): ViewStyle => {
    const baseRadius = theme.device.isTablet ? 24 : 20;

    const baseStyle: ViewStyle = {
      backgroundColor: "transparent",
    };

    switch (variant) {
      case "sheet":
        return {
          ...baseStyle,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "85%",
          borderTopLeftRadius: baseRadius,
          borderTopRightRadius: baseRadius,
          overflow: "hidden",
        };

      case "center":
        return {
          ...baseStyle,
          maxWidth: theme.device.isTablet ? "80%" : "90%",
          maxHeight: "80%",
          borderRadius: baseRadius,
          overflow: "hidden",
          alignSelf: "center",
        };

      case "hero":
        return {
          ...baseStyle,
          maxWidth: theme.device.isTablet ? "85%" : "95%",
          maxHeight: "90%",
          borderRadius: baseRadius + 4,
          overflow: "hidden",
          alignSelf: "center",
        };

      case "fullscreen":
        return {
          ...baseStyle,
          flex: 1,
          marginTop: insets.top,
          marginBottom: insets.bottom,
          borderRadius: baseRadius,
          overflow: "hidden",
        };

      default:
        return baseStyle;
    }
  };

  // Get content styles with adaptive padding
  const getContentStyle = (): ViewStyle => ({
    flex: 1,
    backgroundColor:
      getIntelligentBlurIntensity() > 0
        ? "transparent"
        : colors.content.backgroundModal,
    padding: theme.spacing.content[contentPadding],
    paddingBottom: Math.max(
      theme.spacing.content[contentPadding],
      insets.bottom + theme.spacing.sm
    ),
  });

  // Render modal content with intelligent glass
  const renderModalContent = () => {
    const content = (
      <View style={getContentStyle()}>
        {/* Gesture handle for sheet modals */}
        {variant === "sheet" && gestureArea === "handle" && (
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.content.tertiary,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: theme.spacing.base,
              opacity: 0.6,
            }}
          />
        )}

        {/* Modal header */}
        {(title || subtitle) && (
          <View
            style={{
              marginBottom: theme.spacing.content.section,
              alignItems:
                variant === "center" || variant === "hero"
                  ? "center"
                  : "flex-start",
            }}
          >
            {title && (
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.headlineMedium
                    : theme.typography.material.headlineMedium,
                  {
                    color: colors.content.primary,
                    textAlign:
                      variant === "center" || variant === "hero"
                        ? "center"
                        : "left",
                    marginBottom: subtitle ? theme.spacing.xs : 0,
                  },
                ]}
                accessibilityRole="header"
              >
                {title}
              </Text>
            )}

            {subtitle && (
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  {
                    color: colors.content.secondary,
                    textAlign:
                      variant === "center" || variant === "hero"
                        ? "center"
                        : "left",
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Modal content */}
        {children}
      </View>
    );

    // Apply intelligent glass effect
    if (getIntelligentBlurIntensity() > 0) {
      return (
        <BlurView
          style={{
            flex: 1,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View
        style={{
          flex: 1,
          justifyContent:
            variant === "center" || variant === "hero" ? "center" : "flex-end",
          alignItems: "stretch",
        }}
      >
        {/* Backdrop with bloom effect */}
        <AnimatedPressable
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.glass.overlayStrong,
            },
            backdropStyle,
          ]}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        >
          {/* Bloom effect */}
          {bloomFeedback && <Animated.View style={bloomStyle} />}
        </AnimatedPressable>

        {/* Modal container with gesture support */}
        {gestureEnabled && variant === "sheet" ? (
          <AnimatedPanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View
              style={[getModalContainerStyle(), modalStyle]}
              accessibilityRole={accessibilityRole}
              accessibilityLabel={accessibilityLabel}
              accessibilityModal
            >
              {renderModalContent()}
            </Animated.View>
          </AnimatedPanGestureHandler>
        ) : (
          <Animated.View
            style={[getModalContainerStyle(), modalStyle]}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={accessibilityLabel}
            accessibilityModal
          >
            {renderModalContent()}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

export default GestureModal;
 