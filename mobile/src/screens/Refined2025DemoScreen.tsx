import React, { useState } from "react";
import { Text, View, ScrollView, Alert, Platform, Switch } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

import {
  ContentModal,
  SocialNavigation,
  ContentCard,
  RefinedMinimalistTheme,
  DesignPrinciples2025,
  type SocialTab,
} from "../components/refined";

export const Refined2025DemoScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [modalVisible, setModalVisible] = useState(false);
  const [glassEnabled, setGlassEnabled] = useState(true);
  const [modalType, setModalType] = useState<"sheet" | "center">("sheet");

  const theme = RefinedMinimalistTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Demo navigation tabs - Instagram/Twitter inspired
  const socialTabs: SocialTab[] = [
    {
      id: "home",
      icon: <Icon name="home" size={24} color={colors.content.tertiary} />,
      iconActive: <Icon name="home" size={24} color={colors.accent.primary} />,
      accessibilityLabel: "Home feed",
    },
    {
      id: "search",
      icon: <Icon name="search" size={24} color={colors.content.tertiary} />,
      iconActive: (
        <Icon name="search" size={24} color={colors.accent.primary} />
      ),
      accessibilityLabel: "Search tunes",
    },
    {
      id: "garage",
      icon: <Icon name="garage" size={24} color={colors.content.tertiary} />,
      iconActive: (
        <Icon name="garage" size={24} color={colors.accent.primary} />
      ),
      badge: 3,
      accessibilityLabel: "My garage",
    },
    {
      id: "activity",
      icon: (
        <Icon
          name="favorite-border"
          size={24}
          color={colors.content.tertiary}
        />
      ),
      iconActive: (
        <Icon name="favorite" size={24} color={colors.accent.primary} />
      ),
      badge: "12",
      accessibilityLabel: "Activity notifications",
    },
    {
      id: "profile",
      icon: (
        <Icon name="person-outline" size={24} color={colors.content.tertiary} />
      ),
      iconActive: (
        <Icon name="person" size={24} color={colors.accent.primary} />
      ),
      accessibilityLabel: "Profile",
    },
  ];

  // Handle interactions with haptic feedback
  const handleCardPress = async (cardType: string) => {
    await Haptics.selectionAsync();
    Alert.alert(
      "🎯 Content-First Interaction",
      `${cardType} card pressed! Notice the generous 3:1 whitespace ratio and ${
        Platform.OS === "ios"
          ? "controlled glass effects"
          : "Material elevation"
      }.`,
      [{ text: "Beautiful!", style: "default" }]
    );
  };

  const handleModalDemo = async (type: "sheet" | "center") => {
    setModalType(type);
    setModalVisible(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colors.content.background,
        }}
        contentContainerStyle={{
          paddingBottom: 120, // Space for navigation
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Bold Typography */}
        <View
          style={{
            paddingHorizontal: theme.spacing.base,
            paddingTop: theme.spacing.content.hero,
            paddingBottom: theme.spacing.content.section,
          }}
        >
          <Text
            style={[
              isIOS
                ? theme.typography.ios.heroDisplay
                : theme.typography.material.heroDisplay,
              {
                color: colors.content.primary,
                textAlign: "center",
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            2025
          </Text>

          <Text
            style={[
              isIOS
                ? theme.typography.ios.titleLarge
                : theme.typography.material.titleLarge,
              {
                color: colors.content.primary,
                textAlign: "center",
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            Refined Minimalist Design
          </Text>

          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyLarge
                : theme.typography.material.bodyLarge,
              {
                color: colors.content.secondary,
                textAlign: "center",
                lineHeight: 32,
                paddingHorizontal: theme.spacing.base,
              },
            ]}
          >
            Content-first layouts, controlled liquid glass, and 3:1 whitespace
            ratios inspired by Instagram, Twitter, and Hinge.
          </Text>
        </View>

        {/* Design Controls */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.titleMedium
                : theme.typography.material.titleMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
              },
            ]}
          >
            🎨 Design Controls
          </Text>

          <ContentCard
            variant="elevated"
            contentPadding="cardInner"
            glassType="none"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: theme.spacing.base,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.content.primary,
                      marginBottom: theme.spacing.xxxs,
                    },
                  ]}
                >
                  🌊 Controlled Glass Effects
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.bodySmall
                      : theme.typography.material.bodySmall,
                    { color: colors.content.secondary },
                  ]}
                >
                  Subtle blur only in key areas
                </Text>
              </View>
              <Switch
                value={glassEnabled}
                onValueChange={setGlassEnabled}
                trackColor={{
                  false: colors.content.border,
                  true: colors.accent.primaryLight,
                }}
                thumbColor={
                  glassEnabled ? colors.accent.primary : colors.content.tertiary
                }
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.sm,
              }}
            >
              <ContentCard
                variant="minimal"
                contentPadding="cardInner"
                glassType="none"
                style={{ flex: 1, marginBottom: 0 }}
                onPress={() => handleModalDemo("sheet")}
              >
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    {
                      color: colors.accent.primary,
                      textAlign: "center",
                      fontWeight: "600",
                    },
                  ]}
                >
                  Sheet Modal
                </Text>
              </ContentCard>

              <ContentCard
                variant="minimal"
                contentPadding="cardInner"
                glassType="none"
                style={{ flex: 1, marginBottom: 0 }}
                onPress={() => handleModalDemo("center")}
              >
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    {
                      color: colors.accent.primary,
                      textAlign: "center",
                      fontWeight: "600",
                    },
                  ]}
                >
                  Center Modal
                </Text>
              </ContentCard>
            </View>
          </ContentCard>
        </View>

        {/* Content-First Cards */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.titleMedium
                : theme.typography.material.titleMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
                marginTop: theme.spacing.content.section,
              },
            ]}
          >
            📝 Content-First Cards
          </Text>

          {/* Hero Content Card */}
          <ContentCard
            variant="hero"
            contentPadding="cardInner"
            glassType={glassEnabled ? "subtle" : "none"}
            onPress={() => handleCardPress("Hero Content")}
          >
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.titleLarge
                  : theme.typography.material.titleLarge,
                {
                  color: colors.content.primary,
                  marginBottom: theme.spacing.content.paragraph,
                },
              ]}
            >
              ✨ Hero Content
            </Text>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyLarge
                  : theme.typography.material.bodyLarge,
                {
                  color: colors.content.secondary,
                  lineHeight: 32,
                  marginBottom: theme.spacing.content.paragraph,
                },
              ]}
            >
              Generous whitespace creates breathing room. Notice the 3:1
              whitespace-to-content ratio that makes content feel spacious and
              readable.
            </Text>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodySmall
                  : theme.typography.material.bodySmall,
                { color: colors.content.tertiary },
              ]}
            >
              Tap to experience micro-interactions
            </Text>
          </ContentCard>

          {/* Content Grid */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.content.cardOuter,
              marginBottom: theme.spacing.content.section,
            }}
          >
            <ContentCard
              variant="elevated"
              contentPadding="cardInner"
              glassType={glassEnabled ? "subtle" : "none"}
              style={{ flex: 1, marginBottom: 0 }}
              onPress={() => handleCardPress("Focus")}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: theme.spacing.xs }}>
                  🎯
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.content.primary,
                      textAlign: "center",
                      marginBottom: theme.spacing.xxxs,
                    },
                  ]}
                >
                  Focus
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.caption
                      : theme.typography.material.bodySmall,
                    {
                      color: colors.content.tertiary,
                      textAlign: "center",
                    },
                  ]}
                >
                  Content over chrome
                </Text>
              </View>
            </ContentCard>

            <ContentCard
              variant="elevated"
              contentPadding="cardInner"
              glassType={glassEnabled ? "subtle" : "none"}
              style={{ flex: 1, marginBottom: 0 }}
              onPress={() => handleCardPress("Performance")}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: theme.spacing.xs }}>
                  ⚡
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.content.primary,
                      textAlign: "center",
                      marginBottom: theme.spacing.xxxs,
                    },
                  ]}
                >
                  60fps
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.caption
                      : theme.typography.material.bodySmall,
                    {
                      color: colors.content.tertiary,
                      textAlign: "center",
                    },
                  ]}
                >
                  Native performance
                </Text>
              </View>
            </ContentCard>

            <ContentCard
              variant="elevated"
              contentPadding="cardInner"
              glassType={glassEnabled ? "subtle" : "none"}
              style={{ flex: 1, marginBottom: 0 }}
              onPress={() => handleCardPress("Accessibility")}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: theme.spacing.xs }}>
                  ♿
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.content.primary,
                      textAlign: "center",
                      marginBottom: theme.spacing.xxxs,
                    },
                  ]}
                >
                  WCAG AA
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.caption
                      : theme.typography.material.bodySmall,
                    {
                      color: colors.content.tertiary,
                      textAlign: "center",
                    },
                  ]}
                >
                  4.5:1 contrast
                </Text>
              </View>
            </ContentCard>
          </View>
        </View>

        {/* Design Principles */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.titleMedium
                : theme.typography.material.titleMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
              },
            ]}
          >
            📐 2025 Design Principles
          </Text>

          <ContentCard
            variant="elevated"
            contentPadding="cardInner"
            glassType="none"
          >
            {Object.entries(DesignPrinciples2025).map(([key, value], index) => (
              <View
                key={key}
                style={{
                  marginBottom:
                    index < Object.keys(DesignPrinciples2025).length - 1
                      ? theme.spacing.content.paragraph
                      : 0,
                }}
              >
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    {
                      color: colors.content.primary,
                      marginBottom: theme.spacing.xxxs,
                      textTransform: "capitalize",
                    },
                  ]}
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Text>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.bodySmall
                      : theme.typography.material.bodySmall,
                    { color: colors.content.secondary, lineHeight: 20 },
                  ]}
                >
                  {value}
                </Text>
              </View>
            ))}
          </ContentCard>
        </View>

        {/* Platform Info */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.titleMedium
                : theme.typography.material.titleMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
                marginTop: theme.spacing.content.section,
              },
            ]}
          >
            📱 Platform Adaptive
          </Text>

          <ContentCard
            variant="elevated"
            contentPadding="cardInner"
            glassType="none"
          >
            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Platform: {Platform.OS} {Platform.Version}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Typography: {isIOS ? "SF Pro Display/Text" : "Roboto"}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Glass Effects:{" "}
                {isIOS ? "Native BlurView" : "Material Elevation"}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Haptics: ✅ Platform-optimized feedback
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Navigation: Instagram/Twitter/Hinge style
              </Text>
            </View>
          </ContentCard>
        </View>
      </ScrollView>

      {/* Social Navigation - Instagram/Twitter Style */}
      <SocialNavigation
        tabs={socialTabs}
        activeTabId={activeTab}
        onTabPress={setActiveTab}
        variant={glassEnabled && isIOS ? "glass" : "minimal"}
        glassType="subtle"
        showLabels={false}
        showIndicator={true}
        haptic={true}
      />

      {/* Demo Modal - Context Preservation */}
      <ContentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        variant={modalType}
        title="Modal Demo"
        subtitle="Context-preserving overlay instead of full screen push"
        glassType={glassEnabled ? "medium" : "subtle"}
        haptic={true}
        accessibilityLabel="Demo modal showcasing refined design"
      >
        <View style={{ gap: theme.spacing.content.paragraph }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyLarge
                : theme.typography.material.bodyLarge,
              {
                color: colors.content.primary,
                lineHeight: 28,
              },
            ]}
          >
            This modal preserves context instead of pushing a full screen.
            Notice the controlled glass effect and generous content spacing.
          </Text>

          <ContentCard
            variant="minimal"
            contentPadding="cardInner"
            glassType="none"
            style={{ marginBottom: 0 }}
          >
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.labelLarge
                  : theme.typography.material.labelLarge,
                {
                  color: colors.content.primary,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              🎯 Key Benefits
            </Text>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyMedium
                  : theme.typography.material.bodyMedium,
                { color: colors.content.secondary, lineHeight: 24 },
              ]}
            >
              • Context preservation{"\n"}• Controlled glass effects{"\n"}• 3:1
              whitespace ratios{"\n"}• Instagram/Twitter-level polish
            </Text>
          </ContentCard>
        </View>
      </ContentModal>
    </>
  );
};

export default Refined2025DemoScreen;
