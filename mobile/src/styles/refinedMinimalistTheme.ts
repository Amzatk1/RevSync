import { moderateScale } from "react-native-size-matters";
import { Appearance, Platform } from "react-native";

// 2025 Minimalist Design - Ultra Content-First, Controlled Glass Effects
const createRefinedMinimalistColors = () => {
  const isDark = Appearance.getColorScheme() === "dark";

  return {
    // Ultra-Neutral Palette - Instagram/Twitter Inspired
    content: {
      // Content hierarchy - 4.5:1 WCAG AA minimum contrast
      primary: isDark ? "#FFFFFF" : "#1A1A1A", // High-contrast text
      secondary: isDark ? "#E5E5E5" : "#404040", // Secondary text
      tertiary: isDark ? "#A0A0A0" : "#6B6B6B", // Metadata/captions
      quaternary: isDark ? "#6B6B6B" : "#A0A0A0", // Disabled/placeholder

      // Background system - Generous whitespace foundation
      background: isDark ? "#000000" : "#FFFFFF", // Pure backgrounds
      backgroundSubtle: isDark ? "#0A0A0A" : "#FAFAFA", // Subtle elevation
      backgroundElevated: isDark ? "#1A1A1A" : "#F5F5F5", // Card backgrounds
      backgroundModal: isDark ? "#1F1F1F" : "#FFFFFF", // Modal overlays

      // Minimal borders and dividers
      border: isDark ? "#2A2A2A" : "#E8E8E8", // Subtle boundaries
      borderStrong: isDark ? "#404040" : "#D0D0D0", // Defined borders
      divider: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.03)", // Ultra-minimal dividers
    },

    // Single Accent System - RevSync Orange with Refined Variations
    accent: {
      primary: "#FF6B35", // Hero RevSync Orange
      primaryHover: "#E55A2B", // Hover state
      primaryActive: "#CC4A1F", // Pressed state
      primaryDisabled: "#FFB299", // Disabled state

      // Refined accent applications
      primarySubtle: "rgba(255, 107, 53, 0.08)", // 8% opacity - subtle highlights
      primaryMedium: "rgba(255, 107, 53, 0.16)", // 16% opacity - medium emphasis
      primaryStrong: "rgba(255, 107, 53, 0.24)", // 24% opacity - strong emphasis
    },

    // Semantic Colors - Minimal but Accessible
    semantic: {
      success: isDark ? "#4ADE80" : "#16A34A", // Green
      warning: isDark ? "#FBBF24" : "#D97706", // Amber
      error: isDark ? "#F87171" : "#DC2626", // Red
      info: isDark ? "#60A5FA" : "#2563EB", // Blue

      // Subtle semantic backgrounds
      successBg: isDark
        ? "rgba(74, 222, 128, 0.08)"
        : "rgba(22, 163, 74, 0.06)",
      warningBg: isDark
        ? "rgba(251, 191, 36, 0.08)"
        : "rgba(217, 119, 6, 0.06)",
      errorBg: isDark ? "rgba(248, 113, 113, 0.08)" : "rgba(220, 38, 38, 0.06)",
      infoBg: isDark ? "rgba(96, 165, 250, 0.08)" : "rgba(37, 99, 235, 0.06)",
    },

    // Controlled Liquid Glass System - Subtle, Not Overbearing
    glass: {
      // Navigation glass - Very subtle
      nav: isDark
        ? "rgba(26, 26, 26, 0.85)" // Dark nav glass
        : "rgba(255, 255, 255, 0.85)", // Light nav glass

      // Modal glass - Slightly stronger for definition
      modal: isDark
        ? "rgba(31, 31, 31, 0.90)" // Dark modal glass
        : "rgba(250, 250, 250, 0.90)", // Light modal glass

      // Accent glass - For hero elements only
      accent: isDark
        ? "rgba(26, 26, 26, 0.95)" // Dark accent glass
        : "rgba(255, 255, 255, 0.95)", // Light accent glass

      // Overlay system
      overlay: isDark
        ? "rgba(0, 0, 0, 0.4)" // Dark overlay
        : "rgba(0, 0, 0, 0.2)", // Light overlay

      overlayStrong: isDark
        ? "rgba(0, 0, 0, 0.7)" // Strong dark overlay
        : "rgba(0, 0, 0, 0.4)", // Strong light overlay
    },
  };
};

// Bold Typography System - Content-First with Expressive Hierarchy
const createRefinedTypography = () => ({
  // iOS SF Pro System - Refined for 2025
  ios: {
    // Hero typography - Big, bold, expressive
    heroDisplay: {
      fontSize: moderateScale(56),
      fontWeight: "800" as const,
      lineHeight: moderateScale(60),
      letterSpacing: -1.0,
      fontFamily: "SF Pro Display",
    },
    heroTitle: {
      fontSize: moderateScale(44),
      fontWeight: "700" as const,
      lineHeight: moderateScale(48),
      letterSpacing: -0.5,
      fontFamily: "SF Pro Display",
    },

    // Content hierarchy - Bold and readable
    titleLarge: {
      fontSize: moderateScale(32),
      fontWeight: "700" as const,
      lineHeight: moderateScale(38),
      letterSpacing: -0.25,
      fontFamily: "SF Pro Display",
    },
    titleMedium: {
      fontSize: moderateScale(24),
      fontWeight: "600" as const,
      lineHeight: moderateScale(30),
      letterSpacing: 0,
      fontFamily: "SF Pro Display",
    },
    titleSmall: {
      fontSize: moderateScale(20),
      fontWeight: "600" as const,
      lineHeight: moderateScale(26),
      letterSpacing: 0,
      fontFamily: "SF Pro Text",
    },

    // Body text - Optimized for reading
    bodyLarge: {
      fontSize: moderateScale(18),
      fontWeight: "400" as const,
      lineHeight: moderateScale(28),
      letterSpacing: 0,
      fontFamily: "SF Pro Text",
    },
    bodyMedium: {
      fontSize: moderateScale(16),
      fontWeight: "400" as const,
      lineHeight: moderateScale(24),
      letterSpacing: 0,
      fontFamily: "SF Pro Text",
    },
    bodySmall: {
      fontSize: moderateScale(14),
      fontWeight: "400" as const,
      lineHeight: moderateScale(20),
      letterSpacing: 0,
      fontFamily: "SF Pro Text",
    },

    // Labels and UI elements
    labelLarge: {
      fontSize: moderateScale(16),
      fontWeight: "600" as const,
      lineHeight: moderateScale(20),
      letterSpacing: 0.1,
      fontFamily: "SF Pro Text",
    },
    labelMedium: {
      fontSize: moderateScale(14),
      fontWeight: "500" as const,
      lineHeight: moderateScale(18),
      letterSpacing: 0.2,
      fontFamily: "SF Pro Text",
    },
    labelSmall: {
      fontSize: moderateScale(12),
      fontWeight: "500" as const,
      lineHeight: moderateScale(16),
      letterSpacing: 0.3,
      fontFamily: "SF Pro Text",
    },

    // Caption and metadata
    caption: {
      fontSize: moderateScale(11),
      fontWeight: "400" as const,
      lineHeight: moderateScale(14),
      letterSpacing: 0.4,
      fontFamily: "SF Pro Text",
    },
  },

  // Material Design 3 - Refined for Android
  material: {
    // Hero typography
    heroDisplay: {
      fontSize: moderateScale(64),
      fontWeight: "400" as const,
      lineHeight: moderateScale(72),
      letterSpacing: -0.5,
      fontFamily: "Roboto",
    },
    heroTitle: {
      fontSize: moderateScale(48),
      fontWeight: "400" as const,
      lineHeight: moderateScale(56),
      letterSpacing: -0.25,
      fontFamily: "Roboto",
    },

    // Content hierarchy
    titleLarge: {
      fontSize: moderateScale(32),
      fontWeight: "400" as const,
      lineHeight: moderateScale(40),
      letterSpacing: 0,
      fontFamily: "Roboto",
    },
    titleMedium: {
      fontSize: moderateScale(24),
      fontWeight: "500" as const,
      lineHeight: moderateScale(32),
      letterSpacing: 0,
      fontFamily: "Roboto Medium",
    },
    titleSmall: {
      fontSize: moderateScale(20),
      fontWeight: "500" as const,
      lineHeight: moderateScale(28),
      letterSpacing: 0,
      fontFamily: "Roboto Medium",
    },

    // Body text
    bodyLarge: {
      fontSize: moderateScale(18),
      fontWeight: "400" as const,
      lineHeight: moderateScale(28),
      letterSpacing: 0.15,
      fontFamily: "Roboto",
    },
    bodyMedium: {
      fontSize: moderateScale(16),
      fontWeight: "400" as const,
      lineHeight: moderateScale(24),
      letterSpacing: 0.25,
      fontFamily: "Roboto",
    },
    bodySmall: {
      fontSize: moderateScale(14),
      fontWeight: "400" as const,
      lineHeight: moderateScale(20),
      letterSpacing: 0.4,
      fontFamily: "Roboto",
    },

    // Labels
    labelLarge: {
      fontSize: moderateScale(16),
      fontWeight: "500" as const,
      lineHeight: moderateScale(20),
      letterSpacing: 0.1,
      fontFamily: "Roboto Medium",
    },
    labelMedium: {
      fontSize: moderateScale(14),
      fontWeight: "500" as const,
      lineHeight: moderateScale(18),
      letterSpacing: 0.5,
      fontFamily: "Roboto Medium",
    },
    labelSmall: {
      fontSize: moderateScale(12),
      fontWeight: "500" as const,
      lineHeight: moderateScale(16),
      letterSpacing: 0.5,
      fontFamily: "Roboto Medium",
    },

    // Caption
    caption: {
      fontSize: moderateScale(11),
      fontWeight: "400" as const,
      lineHeight: moderateScale(14),
      letterSpacing: 0.4,
      fontFamily: "Roboto",
    },
  },
});

// 3:1 Whitespace System - Instagram/Twitter Inspired Generous Spacing
const createRefinedSpacing = () => ({
  // Micro spacing
  xxxs: moderateScale(2),
  xxs: moderateScale(4),
  xs: moderateScale(8),

  // Core spacing - 3:1 whitespace ratio
  sm: moderateScale(16), // Small gaps
  base: moderateScale(24), // Base unit (generous)
  lg: moderateScale(32), // Large gaps
  xl: moderateScale(48), // Extra large gaps

  // Bold whitespace - Content-first philosophy
  "2xl": moderateScale(64), // Section separators
  "3xl": moderateScale(96), // Major sections
  "4xl": moderateScale(128), // Screen sections
  "5xl": moderateScale(160), // Hero spacing

  // Content-first spacing system
  content: {
    // Reading-optimized spacing
    paragraph: moderateScale(24), // Between paragraphs
    section: moderateScale(48), // Between content sections
    chapter: moderateScale(72), // Between major content blocks
    hero: moderateScale(96), // Hero section spacing

    // UI spacing
    cardInner: moderateScale(20), // Inside cards
    cardOuter: moderateScale(16), // Between cards
    listItem: moderateScale(16), // List item spacing
    buttonGap: moderateScale(12), // Between buttons
  },

  // Navigation spacing - Social app inspired
  nav: {
    barHeight: moderateScale(56), // Standard nav height
    tabHeight: moderateScale(64), // Tab bar height (thumb-friendly)
    iconSize: moderateScale(24), // Icon size
    iconPadding: moderateScale(8), // Around icons
    labelGap: moderateScale(4), // Icon to label gap
  },
});

// Refined Border Radius - Subtle and Modern
const createRefinedBorderRadius = () => ({
  none: 0,

  // Subtle curves for content
  xs: moderateScale(4), // Minimal elements
  sm: moderateScale(8), // Buttons/inputs
  base: moderateScale(12), // Cards
  lg: moderateScale(16), // Prominent cards
  xl: moderateScale(20), // Hero elements
  "2xl": moderateScale(24), // Major containers

  // Special cases
  pill: 9999, // Full rounding
  circle: "50%", // Perfect circles

  // Platform-specific refinements
  ios: {
    button: moderateScale(10), // iOS button style
    card: moderateScale(12), // iOS card style
    modal: moderateScale(16), // iOS modal style
  },

  material: {
    button: moderateScale(8), // Material button
    card: moderateScale(12), // Material card
    modal: moderateScale(16), // Material modal
  },
});

// Ultra-Subtle Shadows - Depth Without Distraction
const createRefinedShadows = () => ({
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Controlled depth system
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Ultra-subtle
    shadowRadius: 2,
    elevation: 1,
  },

  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, // Very soft
    shadowRadius: 4,
    elevation: 2,
  },

  medium: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // Gentle presence
    shadowRadius: 8,
    elevation: 3,
  },

  strong: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, // For modals only
    shadowRadius: 16,
    elevation: 5,
  },
});

// Refined Motion System - 60fps Native Performance
const createRefinedAnimations = () => ({
  // Timing - Feels natural and responsive
  duration: {
    instant: 0,
    micro: 100, // Micro-interactions
    fast: Platform.OS === "ios" ? 200 : 150, // Quick feedback
    normal: Platform.OS === "ios" ? 300 : 250, // Standard transitions
    slow: Platform.OS === "ios" ? 400 : 350, // Deliberate transitions
    dramatic: 600, // Hero transitions only
  },

  // Spring physics - Instagram/Twitter level smoothness
  spring: {
    gentle: {
      damping: 25,
      stiffness: 300,
      mass: 1,
    },
    bouncy: {
      damping: 18,
      stiffness: 400,
      mass: 0.8,
    },
    snappy: {
      damping: 20,
      stiffness: 500,
      mass: 0.6,
    },
  },

  // Easing curves - Natural motion
  easing: {
    ios: {
      standard: "cubic-bezier(0.4, 0.0, 0.2, 1.0)",
      decelerated: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
      accelerated: "cubic-bezier(0.4, 0.0, 1, 1.0)",
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
    material: {
      standard: "cubic-bezier(0.2, 0.0, 0, 1.0)",
      decelerated: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
      accelerated: "cubic-bezier(0.4, 0.0, 1, 1.0)",
      emphasized: "cubic-bezier(0.2, 0.0, 0, 1.0)",
    },
  },

  // Interaction presets
  presets: {
    buttonPress: {
      scale: 0.96,
      duration: 100,
      spring: "gentle",
    },
    cardPress: {
      scale: 0.98,
      duration: 150,
      spring: "gentle",
    },
    modalSlide: {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 300,
      spring: "bouncy",
    },
    fadeIn: {
      opacity: [0, 1],
      duration: 200,
      easing: "decelerated",
    },
  },
});

// Create the refined minimalist theme
const createRefinedMinimalistTheme = () => {
  const colors = createRefinedMinimalistColors();
  const typography = createRefinedTypography();
  const spacing = createRefinedSpacing();
  const borderRadius = createRefinedBorderRadius();
  const shadows = createRefinedShadows();
  const animations = createRefinedAnimations();

  return {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,

    // Platform detection
    platform: {
      isIOS: Platform.OS === "ios",
      isAndroid: Platform.OS === "android",
      select: Platform.select,
    },

    // Theme state
    isDark: Appearance.getColorScheme() === "dark",

    // 2025 Design Principles
    principles: {
      contentFirst: true, // Content over chrome
      generousWhitespace: true, // 3:1 ratio
      controlledGlass: true, // Subtle, not overbearing
      singleAccent: true, // RevSync Orange only
      boldTypography: true, // Expressive hierarchy
      accessibilityFirst: true, // WCAG AA minimum
      nativePerformance: true, // 60fps animations
      modalNotPush: true, // Context preservation
    },

    // Glass blur settings - Controlled for accessibility
    glass: {
      // Blur intensities - Conservative approach
      subtle: Platform.OS === "ios" ? 15 : 8,
      medium: Platform.OS === "ios" ? 25 : 12,
      strong: Platform.OS === "ios" ? 35 : 16,

      // Accessibility considerations
      reduceTransparency: false, // Will be set by system preferences
      highContrast: false, // Will be set by system preferences
    },

    // Content-first breakpoints
    breakpoints: {
      phone: 0,
      tablet: 768,
      desktop: 1024,
    },
  };
};

export const RefinedMinimalistTheme = createRefinedMinimalistTheme();
export default RefinedMinimalistTheme;
