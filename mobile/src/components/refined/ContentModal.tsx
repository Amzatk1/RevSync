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
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { RefinedMinimalistTheme } from "../../styles/refinedMinimalistTheme";

export interface ContentModalProps {
  // Content
  children: React.ReactNode;
  title?: string;
  subtitle?: string;

  // Behavior
  visible: boolean;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  haptic?: boolean;

  // Modal variants - Instagram/Twitter inspired
  variant?: "sheet" | "center" | "fullscreen";

  // Glass configuration - Controlled, not overbearing
  glassType?: "subtle" | "medium" | "strong";
  respectsReduceTransparency?: boolean;

  // Content spacing
  contentPadding?: keyof typeof RefinedMinimalistTheme.spacing.content;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityRole?: "dialog" | "alertdialog";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ContentModal: React.FC<ContentModalProps> = ({
  children,
  title,
  subtitle,
  visible,
  onClose,
  closeOnBackdrop = true,
  haptic = true,
  variant = "sheet",
  glassType = "medium",
  respectsReduceTransparency = true,
  contentPadding = "cardInner",
  accessibilityLabel,
  accessibilityRole = "dialog",
}) => {
  const insets = useSafeAreaInsets();
  const theme = RefinedMinimalistTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300);
  const modalScale = useSharedValue(0.9);

  React.useEffect(() => {
    if (visible) {
      // Entrance animation
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
      // Exit animation
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

  // Handle backdrop press
  const handleBackdropPress = async () => {
    if (!closeOnBackdrop) return;

    if (haptic) {
      await Haptics.selectionAsync();
    }

    onClose();
  };

  // Handle close with haptic feedback
  const handleClose = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onClose();
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => {
    if (variant === "sheet") {
      return {
        transform: [{ translateY: modalTranslateY.value }],
      };
    } else {
      return {
        transform: [{ scale: modalScale.value }],
        opacity: backdropOpacity.value,
      };
    }
  });

  // Get glass blur intensity based on type and accessibility
  const getBlurIntensity = (): number => {
    if (!isIOS || theme.glass.reduceTransparency) {
      return 0; // Fallback to solid background
    }

    switch (glassType) {
      case "subtle":
        return theme.glass.subtle;
      case "medium":
        return theme.glass.medium;
      case "strong":
        return theme.glass.strong;
      default:
        return theme.glass.medium;
    }
  };

  // Get modal container styles based on variant
  const getModalContainerStyle = (): ViewStyle => {
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
          maxHeight: "80%",
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
          overflow: "hidden",
        };

      case "center":
        return {
          ...baseStyle,
          maxWidth: "90%",
          maxHeight: "80%",
          borderRadius: theme.borderRadius.xl,
          overflow: "hidden",
          alignSelf: "center",
        };

      case "fullscreen":
        return {
          ...baseStyle,
          flex: 1,
          marginTop: insets.top,
          marginBottom: insets.bottom,
          borderRadius: theme.borderRadius.xl,
          overflow: "hidden",
        };

      default:
        return baseStyle;
    }
  };

  // Get content styles
  const getContentStyle = (): ViewStyle => ({
    flex: 1,
    backgroundColor:
      isIOS && getBlurIntensity() > 0
        ? "transparent"
        : colors.content.backgroundModal,
    padding: theme.spacing.content[contentPadding],
    paddingBottom: Math.max(
      theme.spacing.content[contentPadding],
      insets.bottom + theme.spacing.sm
    ),
  });

  // Render modal content with glass effect
  const renderModalContent = () => {
    const content = (
      <View style={getContentStyle()}>
        {/* Modal header */}
        {(title || subtitle) && (
          <View
            style={{
              marginBottom: theme.spacing.content.section,
              alignItems: variant === "center" ? "center" : "flex-start",
            }}
          >
            {/* Close indicator for sheet */}
            {variant === "sheet" && (
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.content.tertiary,
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: theme.spacing.base,
                }}
              />
            )}

            {title && (
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.titleLarge
                    : theme.typography.material.titleLarge,
                  {
                    color: colors.content.primary,
                    textAlign: variant === "center" ? "center" : "left",
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
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  {
                    color: colors.content.secondary,
                    textAlign: variant === "center" ? "center" : "left",
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}

            {/* Close button for center modal */}
            {variant === "center" && (
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  padding: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                }}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: colors.content.tertiary,
                    fontWeight: "600",
                  }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Modal content */}
        {children}
      </View>
    );

    // Apply glass effect on iOS, solid background elsewhere
    if (isIOS && getBlurIntensity() > 0) {
      return (
        <BlurView
          style={{ flex: 1 }}
          intensity={getBlurIntensity()}
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
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View
        style={{
          flex: 1,
          justifyContent: variant === "center" ? "center" : "flex-end",
          alignItems: "stretch",
        }}
      >
        {/* Backdrop */}
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
        />

        {/* Modal container */}
        <Animated.View
          style={[getModalContainerStyle(), modalStyle]}
          accessibilityRole={accessibilityRole}
          accessibilityLabel={accessibilityLabel}
          accessibilityModal
        >
          {renderModalContent()}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ContentModal;
