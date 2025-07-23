import { moderateScale } from "react-native-size-matters";
import { Appearance, Platform, Dimensions } from "react-native";

// Award-Winning Design - Beyond 2025 Standards
// Adaptive Typography, Dynamic Accents, Momentum Physics

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Device breakpoints for fluid typography
const getDeviceType = () => {
  if (screenWidth < 768) return "phone";
  if (screenWidth < 1024) return "tablet";
  return "desktop";
};

const createAdaptiveColors = () => {
  const isDark = Appearance.getColorScheme() === "dark";
  const deviceType = getDeviceType();

  return {
    // Ultra-refined content hierarchy with perfect contrast
    content: {
      // 4.5:1 WCAG AA+ contrast ratios
      primary: isDark ? "#FFFFFF" : "#111111", // Ultra-high contrast
      secondary: isDark ? "#F0F0F0" : "#333333", // Strong secondary
      tertiary: isDark ? "#B8B8B8" : "#666666", // Clear tertiary
      quaternary: isDark ? "#808080" : "#999999", // Subtle quaternary

      // Adaptive backgrounds with device optimization
      background: isDark ? "#000000" : "#FFFFFF", // Pure backgrounds
      backgroundSubtle: isDark ? "#0A0A0A" : "#FCFCFC", // Breathing room
      backgroundElevated: isDark ? "#161616" : "#F8F8F8", // Gentle elevation
      backgroundModal: isDark ? "#1A1A1A" : "#FFFFFF", // Modal clarity

      // Ultra-minimal borders with perfect subtlety
      border: isDark ? "#2A2A2A" : "#EEEEEE", // Barely there
      borderStrong: isDark ? "#404040" : "#CCCCCC", // When needed
      divider: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.025)", // Whisper-thin
    },

    // Dynamic Accent System - State-Dependent Intelligence
    accent: {
      // Core RevSync Orange with emotional intelligence
      primary: "#FF6B35", // Hero state
      primaryDeep: "#E55528", // Active/pressed - deeper for engagement
      primarySoft: "#FF8A5C", // Hover - softer for approachability
      primaryGlow: "#FFB085", // Glow state - warm expansion
      primaryDisabled: "#FFCCAA", // Disabled - clearly non-interactive

      // Contextual accent variations
      primaryActive: "#CC4A1F", // Strong interaction feedback
      primaryHover: "#F5642E", // Gentle hover invitation
      primaryFocus: "#FF7143", // Focus state clarity
      primaryPressed: "#D9501F", // Satisfying press response

      // Accent applications with emotional mapping
      primarySubtle: "rgba(255, 107, 53, 0.06)", // 6% - whisper
      primaryLight: "rgba(255, 107, 53, 0.12)", // 12% - gentle
      primaryMedium: "rgba(255, 107, 53, 0.18)", // 18% - present
      primaryStrong: "rgba(255, 107, 53, 0.25)", // 25% - confident

      // State-dependent glow effects
      glow: {
        subtle: "0 0 8px rgba(255, 107, 53, 0.15)",
        medium: "0 0 16px rgba(255, 107, 53, 0.25)",
        strong: "0 0 24px rgba(255, 107, 53, 0.35)",
      },
    },

    // Semantic colors with emotional intelligence
    semantic: {
      success: isDark ? "#4ADE80" : "#16A34A", // Confident green
      warning: isDark ? "#FBBF24" : "#D97706", // Warm amber
      error: isDark ? "#F87171" : "#DC2626", // Clear red
      info: isDark ? "#60A5FA" : "#2563EB", // Trustworthy blue

      // Subtle semantic backgrounds with perfect balance
      successBg: isDark
        ? "rgba(74, 222, 128, 0.06)"
        : "rgba(22, 163, 74, 0.04)",
      warningBg: isDark
        ? "rgba(251, 191, 36, 0.06)"
        : "rgba(217, 119, 6, 0.04)",
      errorBg: isDark ? "rgba(248, 113, 113, 0.06)" : "rgba(220, 38, 38, 0.04)",
      infoBg: isDark ? "rgba(96, 165, 250, 0.06)" : "rgba(37, 99, 235, 0.04)",
    },

    // Context-Aware Glass System - Intelligent Adaptation
    glass: {
      // Navigation glass - Performance aware
      nav: {
        default: isDark
          ? "rgba(26, 26, 26, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        textHeavy: isDark
          ? "rgba(26, 26, 26, 0.95)" // Less blur behind text
          : "rgba(255, 255, 255, 0.95)",
        interactive: isDark
          ? "rgba(26, 26, 26, 0.75)" // More blur during interaction
          : "rgba(255, 255, 255, 0.75)",
      },

      // Modal glass - Content-aware adaptation
      modal: {
        default: isDark
          ? "rgba(31, 31, 31, 0.90)"
          : "rgba(250, 250, 250, 0.90)",
        textHeavy: isDark
          ? "rgba(31, 31, 31, 0.96)" // Crystal clear behind text
          : "rgba(250, 250, 250, 0.96)",
        hero: isDark
          ? "rgba(31, 31, 31, 0.85)" // Slightly more transparent for hero
          : "rgba(250, 250, 250, 0.85)",
      },

      // Dynamic blur intensities - Context aware
      intensity: {
        subtle: Platform.OS === "ios" ? 12 : 6,
        medium: Platform.OS === "ios" ? 20 : 10,
        strong: Platform.OS === "ios" ? 35 : 16,
        textHeavy: Platform.OS === "ios" ? 8 : 4, // Lower behind text
        interactive: Platform.OS === "ios" ? 25 : 12, // Dynamic during interaction
      },

      // Overlay system with momentum
      overlay: isDark ? "rgba(0, 0, 0, 0.35)" : "rgba(0, 0, 0, 0.15)",
      overlayStrong: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.35)",
    },

    // Touch feedback bloom system
    bloom: {
      primary: "rgba(255, 107, 53, 0.4)", // Primary touch bloom
      secondary: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)", // Secondary touch bloom
      subtle: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)", // Gentle touch bloom
    },
  };
};

// Fluid Typography System - Modular Scale with Device Adaptation
const createFluidTypography = () => {
  const deviceType = getDeviceType();
  const isDark = Appearance.getColorScheme() === "dark";

  // Modular scale with 4pt increments for perfect rhythm
  const getScaledSize = (baseSize: number) => {
    const scaleFactor =
      deviceType === "tablet" ? 1.125 : deviceType === "desktop" ? 1.25 : 1;
    return moderateScale(baseSize * scaleFactor);
  };

  return {
    // iOS SF Pro System - Fluid and Adaptive
    ios: {
      // Hero typography - Award-winning scale
      heroDisplay: {
        fontSize: getScaledSize(64), // Scales from 64 to 80pt
        fontWeight: "800" as const,
        lineHeight: getScaledSize(68),
        letterSpacing: -1.2,
        fontFamily: "SF Pro Display",
      },
      heroTitle: {
        fontSize: getScaledSize(48),
        fontWeight: "700" as const,
        lineHeight: getScaledSize(52),
        letterSpacing: -0.8,
        fontFamily: "SF Pro Display",
      },

      // Dynamic headlines - Device responsive
      headlineLarge: {
        fontSize: getScaledSize(36),
        fontWeight: "700" as const,
        lineHeight: getScaledSize(40),
        letterSpacing: -0.5,
        fontFamily: "SF Pro Display",
      },
      headlineMedium: {
        fontSize: getScaledSize(28),
        fontWeight: "600" as const,
        lineHeight: getScaledSize(32),
        letterSpacing: -0.25,
        fontFamily: "SF Pro Display",
      },
      headlineSmall: {
        fontSize: getScaledSize(24),
        fontWeight: "600" as const,
        lineHeight: getScaledSize(28),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },

      // Fluid body text - Perfect readability
      bodyXLarge: {
        fontSize: getScaledSize(20),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(32),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },
      bodyLarge: {
        fontSize: getScaledSize(18),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(28),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },
      bodyMedium: {
        fontSize: getScaledSize(16),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(24),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },
      bodySmall: {
        fontSize: getScaledSize(14),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(20),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },

      // Adaptive labels
      labelXLarge: {
        fontSize: getScaledSize(18),
        fontWeight: "600" as const,
        lineHeight: getScaledSize(22),
        letterSpacing: 0,
        fontFamily: "SF Pro Text",
      },
      labelLarge: {
        fontSize: getScaledSize(16),
        fontWeight: "600" as const,
        lineHeight: getScaledSize(20),
        letterSpacing: 0.1,
        fontFamily: "SF Pro Text",
      },
      labelMedium: {
        fontSize: getScaledSize(14),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(18),
        letterSpacing: 0.2,
        fontFamily: "SF Pro Text",
      },
      labelSmall: {
        fontSize: getScaledSize(12),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(16),
        letterSpacing: 0.3,
        fontFamily: "SF Pro Text",
      },

      // Contextual caption
      caption: {
        fontSize: getScaledSize(11),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(14),
        letterSpacing: 0.4,
        fontFamily: "SF Pro Text",
      },
    },

    // Material Design 3 - Fluid and Responsive
    material: {
      // Hero typography with fluid scaling
      heroDisplay: {
        fontSize: getScaledSize(72),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(80),
        letterSpacing: -0.8,
        fontFamily: "Roboto",
      },
      heroTitle: {
        fontSize: getScaledSize(56),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(64),
        letterSpacing: -0.5,
        fontFamily: "Roboto",
      },

      // Adaptive headlines
      headlineLarge: {
        fontSize: getScaledSize(36),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(44),
        letterSpacing: 0,
        fontFamily: "Roboto",
      },
      headlineMedium: {
        fontSize: getScaledSize(28),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(36),
        letterSpacing: 0,
        fontFamily: "Roboto Medium",
      },
      headlineSmall: {
        fontSize: getScaledSize(24),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(32),
        letterSpacing: 0,
        fontFamily: "Roboto Medium",
      },

      // Fluid body text
      bodyXLarge: {
        fontSize: getScaledSize(20),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(32),
        letterSpacing: 0.15,
        fontFamily: "Roboto",
      },
      bodyLarge: {
        fontSize: getScaledSize(18),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(28),
        letterSpacing: 0.15,
        fontFamily: "Roboto",
      },
      bodyMedium: {
        fontSize: getScaledSize(16),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(24),
        letterSpacing: 0.25,
        fontFamily: "Roboto",
      },
      bodySmall: {
        fontSize: getScaledSize(14),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(20),
        letterSpacing: 0.4,
        fontFamily: "Roboto",
      },

      // Responsive labels
      labelXLarge: {
        fontSize: getScaledSize(18),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(22),
        letterSpacing: 0.1,
        fontFamily: "Roboto Medium",
      },
      labelLarge: {
        fontSize: getScaledSize(16),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(20),
        letterSpacing: 0.1,
        fontFamily: "Roboto Medium",
      },
      labelMedium: {
        fontSize: getScaledSize(14),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(18),
        letterSpacing: 0.5,
        fontFamily: "Roboto Medium",
      },
      labelSmall: {
        fontSize: getScaledSize(12),
        fontWeight: "500" as const,
        lineHeight: getScaledSize(16),
        letterSpacing: 0.5,
        fontFamily: "Roboto Medium",
      },

      // Adaptive caption
      caption: {
        fontSize: getScaledSize(11),
        fontWeight: "400" as const,
        lineHeight: getScaledSize(14),
        letterSpacing: 0.4,
        fontFamily: "Roboto",
      },
    },
  };
};

// Advanced Spacing - 3:1 Ratio with Fluid Adaptation
const createFluidSpacing = () => {
  const deviceType = getDeviceType();

  // Scale spacing based on device
  const getSpacing = (baseSize: number) => {
    const scaleFactor =
      deviceType === "tablet" ? 1.2 : deviceType === "desktop" ? 1.4 : 1;
    return moderateScale(baseSize * scaleFactor);
  };

  return {
    // Micro spacing - Pixel perfect
    xxxs: getSpacing(2),
    xxs: getSpacing(4),
    xs: getSpacing(8),

    // Core spacing - 3:1 ratio maintained across devices
    sm: getSpacing(16),
    base: getSpacing(24), // Golden ratio base
    lg: getSpacing(32),
    xl: getSpacing(48),

    // Bold whitespace - Award-winning generosity
    "2xl": getSpacing(64),
    "3xl": getSpacing(96),
    "4xl": getSpacing(128),
    "5xl": getSpacing(160),

    // Content-first spacing - Adaptive to device
    content: {
      paragraph: getSpacing(24),
      section: getSpacing(48),
      chapter: getSpacing(72),
      hero: getSpacing(96),
      cardInner: getSpacing(20),
      cardOuter: getSpacing(16),
      listItem: getSpacing(16),
      buttonGap: getSpacing(12),
    },

    // Navigation spacing - Thumb-zone optimization
    nav: {
      barHeight: getSpacing(56),
      tabHeight: getSpacing(64),
      iconSize: getSpacing(24),
      iconPadding: getSpacing(8),
      labelGap: getSpacing(4),
    },
  };
};

// Award-Winning Motion System - Momentum Physics
const createAdvancedAnimations = () => ({
  // Timing with momentum awareness
  duration: {
    instant: 0,
    micro: 100, // Touch feedback
    fast: Platform.OS === "ios" ? 200 : 150, // Quick feedback
    normal: Platform.OS === "ios" ? 300 : 250, // Standard
    slow: Platform.OS === "ios" ? 400 : 350, // Deliberate
    dramatic: 600, // Hero moments
    momentum: 800, // Momentum-based scrolling
  },

  // Advanced spring physics - Award-winning feel
  spring: {
    // Gentle springs for content
    gentle: {
      damping: 28,
      stiffness: 280,
      mass: 1.0,
      overshootClamping: false,
    },
    // Bouncy for interactions
    bouncy: {
      damping: 20,
      stiffness: 380,
      mass: 0.9,
      overshootClamping: false,
    },
    // Snappy for immediate feedback
    snappy: {
      damping: 22,
      stiffness: 480,
      mass: 0.7,
      overshootClamping: false,
    },
    // Momentum for scroll behaviors
    momentum: {
      damping: 15,
      stiffness: 200,
      mass: 1.2,
      overshootClamping: false,
    },
    // Elastic for rubberband effects
    elastic: {
      damping: 12,
      stiffness: 150,
      mass: 1.5,
      overshootClamping: false,
    },
  },

  // Advanced easing curves - Emotional mapping
  easing: {
    ios: {
      standard: "cubic-bezier(0.4, 0.0, 0.2, 1.0)",
      decelerated: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
      accelerated: "cubic-bezier(0.4, 0.0, 1, 1.0)",
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      momentum: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Natural momentum
      elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Elastic bounce
    },
    material: {
      standard: "cubic-bezier(0.2, 0.0, 0, 1.0)",
      decelerated: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
      accelerated: "cubic-bezier(0.4, 0.0, 1, 1.0)",
      emphasized: "cubic-bezier(0.2, 0.0, 0, 1.0)",
      momentum: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },

  // Award-winning interaction presets
  presets: {
    // Touch feedback with bloom
    touchBloom: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.8, 1],
      duration: 200,
      spring: "snappy",
    },
    // Button press with glow
    buttonPress: {
      scale: 0.96,
      duration: 100,
      spring: "snappy",
      glow: true,
    },
    // Card press with momentum
    cardPress: {
      scale: 0.98,
      duration: 150,
      spring: "gentle",
      momentum: true,
    },
    // Modal reveal with physics
    modalReveal: {
      scale: [0.9, 1],
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 350,
      spring: "bouncy",
    },
    // Content reveal with stagger
    contentReveal: {
      scale: [0.95, 1],
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 300,
      spring: "gentle",
      stagger: 50, // Stagger multiple elements
    },
    // Scroll momentum with rubberband
    scrollMomentum: {
      overshoot: 50, // Rubberband distance
      resistance: 0.25, // 25% resistance
      duration: 400,
      spring: "elastic",
    },
    // Swipe dismiss with physics
    swipeDismiss: {
      threshold: 0.3, // 30% swipe to dismiss
      velocity: 500, // Minimum velocity
      spring: "momentum",
    },
  },

  // Bloom touch feedback system
  bloom: {
    duration: 200,
    maxRadius: 100,
    initialOpacity: 0.4,
    finalOpacity: 0,
    easing: "ease-out",
  },
});

// Create the award-winning theme
const createAwardWinningTheme = () => {
  const colors = createAdaptiveColors();
  const typography = createFluidTypography();
  const spacing = createFluidSpacing();
  const animations = createAdvancedAnimations();

  return {
    colors,
    typography,
    spacing,
    animations,

    // Device awareness
    device: {
      type: getDeviceType(),
      width: screenWidth,
      height: screenHeight,
      isLargeScreen: screenWidth >= 768,
      isTablet: screenWidth >= 768 && screenWidth < 1024,
      isDesktop: screenWidth >= 1024,
    },

    // Platform detection
    platform: {
      isIOS: Platform.OS === "ios",
      isAndroid: Platform.OS === "android",
      select: Platform.select,
    },

    // Theme state
    isDark: Appearance.getColorScheme() === "dark",

    // Award-winning principles
    principles: {
      fluidTypography: true, // Responsive across devices
      dynamicAccents: true, // State-dependent colors
      momentumPhysics: true, // Natural motion
      contextAwareGlass: true, // Intelligent blur
      gestureNavigation: true, // Swipe interactions
      bloomFeedback: true, // Organic touch response
      contentFirst: true, // Content over chrome
      accessibilityFirst: true, // Universal design
    },

    // Advanced settings
    advanced: {
      // Glass adaptation based on content and performance
      glassAdaptation: {
        textHeavy: true, // Reduce blur behind text
        performanceAware: true, // Adapt to device capability
        contextSensitive: true, // Change based on content type
      },
      // Touch feedback intelligence
      touchFeedback: {
        bloomEnabled: true,
        hapticSync: true, // Sync haptics with visual feedback
        adaptiveIntensity: true, // Adjust based on interaction
      },
      // Momentum behaviors
      momentum: {
        rubberbandEnabled: true,
        elasticOverscroll: true,
        gestureVelocity: true, // Respect gesture velocity
      },
    },
  };
};

export const AwardWinningTheme = createAwardWinningTheme();
export default AwardWinningTheme;
