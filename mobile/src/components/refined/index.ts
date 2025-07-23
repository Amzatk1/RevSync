// Refined 2025 Design System - Instagram/Twitter/Hinge Level
// Ultra Content-First, Controlled Glass, 3:1 Whitespace

// Core Components
export { default as ContentModal } from "./ContentModal";
export { default as SocialNavigation } from "./SocialNavigation";
export { default as ContentCard } from "./ContentCard";

// Theme
export { RefinedMinimalistTheme } from "../../styles/refinedMinimalistTheme";

// Types
export type { ContentModalProps } from "./ContentModal";
export type { SocialNavigationProps, SocialTab } from "./SocialNavigation";
export type { ContentCardProps } from "./ContentCard";

// Component Collections
export const RefinedComponents = {
  ContentModal,
  SocialNavigation,
  ContentCard,
};

// 2025 Design Principles
export const DesignPrinciples2025 = {
  contentFirst:
    "Strip unnecessary UI clutter—users focus on their tunes, not tools",
  generousWhitespace:
    "Use spacious layouts (3:1 whitespace/content) and bold typography",
  controlledGlass:
    "Apply Liquid Glass only in key areas—subtle, not overbearing",
  modalNotPush: "Use glass panels or bottom sheets to maintain context",
  accessibilityFirst:
    "High contrast & WCAG AA compliance with 4.5:1 contrast minimum",
  neutralPalette:
    "Soft grays and whites with single warm accent (RevSync orange)",
  performanceFirst: "60fps native animations with spring-based easing",
};
