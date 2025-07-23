import React, { useState } from "react";
import { Text, View, Alert, Platform, Switch, Button } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

import {
  IntelligentCard,
  MomentumScrollView,
  GestureModal,
  AwardWinningTheme,
  AwardWinningPrinciples,
} from "../components/awardWinning";

export const AwardWinningDemoScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"sheet" | "center" | "hero">(
    "sheet"
  );
  const [bloomEnabled, setBloomEnabled] = useState(true);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [momentumEnabled, setMomentumEnabled] = useState(true);
  const [glassAdaptive, setGlassAdaptive] = useState(true);

  const theme = AwardWinningTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // Handle intelligent interactions
  const handleCardPress = async (cardType: string) => {
    await Haptics.selectionAsync();
    Alert.alert(
      "🏆 Award-Winning Interaction",
      `${cardType} pressed! Experience the ${
        Platform.OS === "ios"
          ? "bloom feedback, momentum physics, and intelligent glass adaptation"
          : "Material elevation with momentum-based interactions"
      }.`,
      [
        {
          text: "Incredible!",
          style: "default",
          onPress: () => console.log("User delighted by award-winning UX"),
        },
      ]
    );
  };

  const handleModalDemo = async (type: "sheet" | "center" | "hero") => {
    setModalType(type);
    setModalVisible(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLongPress = async (action: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "🎯 Gesture Recognition",
      `Long press detected: ${action}. This demonstrates gesture-enabled interactions with momentum physics.`,
      [{ text: "Brilliant!", style: "default" }]
    );
  };

  return (
    <>
      <MomentumScrollView
        style={{
          flex: 1,
          backgroundColor: colors.content.background,
        }}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        rubberbandEnabled={momentumEnabled}
        elasticOverscroll={momentumEnabled}
        hapticFeedback={true}
        contentRevealStagger={true}
        intelligentBounce={true}
        onOverscrollTop={() => console.log("Pull to refresh gesture detected")}
        onOverscrollBottom={() => console.log("Load more gesture detected")}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Fluid Typography */}
        <View
          style={{
            paddingHorizontal: theme.spacing.base,
            paddingTop: theme.spacing.content.hero,
            paddingBottom: theme.spacing.content.section,
            alignItems: "center",
          }}
        >
          <Text
            style={[
              isIOS
                ? theme.typography.ios.heroDisplay
                : theme.typography.material.heroDisplay,
              {
                color: colors.accent.primaryGlow,
                textAlign: "center",
                marginBottom: theme.spacing.lg,
                textShadowColor: colors.accent.glow.subtle,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              },
            ]}
          >
            Award-Winning
          </Text>

          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineLarge
                : theme.typography.material.headlineLarge,
              {
                color: colors.content.primary,
                textAlign: "center",
                marginBottom: theme.spacing.content.paragraph,
              },
            ]}
          >
            Beyond 2025 Design Excellence
          </Text>

          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyXLarge
                : theme.typography.material.bodyXLarge,
              {
                color: colors.content.secondary,
                textAlign: "center",
                lineHeight: theme.device.isTablet ? 36 : 32,
                paddingHorizontal: theme.spacing.base,
              },
            ]}
          >
            Experience fluid typography, dynamic accents, momentum physics, and
            intelligent bloom feedback that rival the world's most sophisticated
            apps.
          </Text>
        </View>

        {/* Advanced Feature Controls */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineMedium
                : theme.typography.material.headlineMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
              },
            ]}
          >
            🚀 Advanced Features
          </Text>

          <IntelligentCard
            variant="elevated"
            bloomEnabled={bloomEnabled}
            momentumEnabled={momentumEnabled}
            adaptiveGlass={glassAdaptive}
            glassType={glassAdaptive ? "adaptLight" : "none"}
          >
            <View style={{ gap: theme.spacing.content.paragraph }}>
              {/* Bloom Feedback Control */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelXLarge
                        : theme.typography.material.labelXLarge,
                      {
                        color: colors.content.primary,
                        marginBottom: theme.spacing.xxxs,
                      },
                    ]}
                  >
                    ✨ Intelligent Bloom Feedback
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyMedium
                        : theme.typography.material.bodyMedium,
                      { color: colors.content.secondary },
                    ]}
                  >
                    Organic touch blooms with haptic sync
                  </Text>
                </View>
                <Switch
                  value={bloomEnabled}
                  onValueChange={setBloomEnabled}
                  trackColor={{
                    false: colors.content.border,
                    true: colors.accent.primarySoft,
                  }}
                  thumbColor={
                    bloomEnabled
                      ? colors.accent.primary
                      : colors.content.tertiary
                  }
                />
              </View>

              {/* Momentum Physics Control */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelXLarge
                        : theme.typography.material.labelXLarge,
                      {
                        color: colors.content.primary,
                        marginBottom: theme.spacing.xxxs,
                      },
                    ]}
                  >
                    🌊 Momentum Physics
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyMedium
                        : theme.typography.material.bodyMedium,
                      { color: colors.content.secondary },
                    ]}
                  >
                    Rubberband overscroll with spring motion
                  </Text>
                </View>
                <Switch
                  value={momentumEnabled}
                  onValueChange={setMomentumEnabled}
                  trackColor={{
                    false: colors.content.border,
                    true: colors.accent.primarySoft,
                  }}
                  thumbColor={
                    momentumEnabled
                      ? colors.accent.primary
                      : colors.content.tertiary
                  }
                />
              </View>

              {/* Adaptive Glass Control */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelXLarge
                        : theme.typography.material.labelXLarge,
                      {
                        color: colors.content.primary,
                        marginBottom: theme.spacing.xxxs,
                      },
                    ]}
                  >
                    🧠 Context-Aware Glass
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyMedium
                        : theme.typography.material.bodyMedium,
                      { color: colors.content.secondary },
                    ]}
                  >
                    Intelligent blur adaptation for content
                  </Text>
                </View>
                <Switch
                  value={glassAdaptive}
                  onValueChange={setGlassAdaptive}
                  trackColor={{
                    false: colors.content.border,
                    true: colors.accent.primarySoft,
                  }}
                  thumbColor={
                    glassAdaptive
                      ? colors.accent.primary
                      : colors.content.tertiary
                  }
                />
              </View>
            </View>
          </IntelligentCard>

          {/* Modal Demonstrations */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.content.cardOuter,
              marginTop: theme.spacing.content.section,
            }}
          >
            <IntelligentCard
              variant="minimal"
              style={{ flex: 1, marginBottom: 0 }}
              bloomEnabled={bloomEnabled}
              onPress={() => handleModalDemo("sheet")}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  {
                    color: colors.accent.primary,
                    textAlign: "center",
                    fontWeight: "600",
                  },
                ]}
              >
                Gesture Sheet
              </Text>
            </IntelligentCard>

            <IntelligentCard
              variant="minimal"
              style={{ flex: 1, marginBottom: 0 }}
              bloomEnabled={bloomEnabled}
              onPress={() => handleModalDemo("center")}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  {
                    color: colors.accent.primary,
                    textAlign: "center",
                    fontWeight: "600",
                  },
                ]}
              >
                Center Modal
              </Text>
            </IntelligentCard>

            <IntelligentCard
              variant="minimal"
              style={{ flex: 1, marginBottom: 0 }}
              bloomEnabled={bloomEnabled}
              onPress={() => handleModalDemo("hero")}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  {
                    color: colors.accent.primary,
                    textAlign: "center",
                    fontWeight: "600",
                  },
                ]}
              >
                Hero Modal
              </Text>
            </IntelligentCard>
          </View>
        </View>

        {/* Intelligent Touch Showcase */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineMedium
                : theme.typography.material.headlineMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
                marginTop: theme.spacing.content.section,
              },
            ]}
          >
            🎯 Intelligent Touch Feedback
          </Text>

          {/* Hero Gesture Card */}
          <IntelligentCard
            variant="hero"
            bloomEnabled={bloomEnabled}
            momentumEnabled={momentumEnabled}
            gestureEnabled={gesturesEnabled}
            adaptiveGlass={glassAdaptive}
            glassType={glassAdaptive ? "subtle" : "none"}
            onPress={() => handleCardPress("Hero Intelligent")}
            onLongPress={() => handleLongPress("Hero card reveal")}
            textContent={false}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.headlineLarge
                    : theme.typography.material.headlineLarge,
                  {
                    color: colors.content.primary,
                    textAlign: "center",
                    marginBottom: theme.spacing.content.paragraph,
                  },
                ]}
              >
                🏆 Experience Excellence
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyXLarge
                    : theme.typography.material.bodyXLarge,
                  {
                    color: colors.content.secondary,
                    lineHeight: theme.device.isTablet ? 36 : 32,
                    textAlign: "center",
                    marginBottom: theme.spacing.content.paragraph,
                  },
                ]}
              >
                Tap for bloom feedback. Long press for gesture recognition.
                Swipe for momentum physics.
              </Text>
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  backgroundColor: colors.accent.primarySubtle,
                  borderRadius: theme.device.isTablet ? 16 : 12,
                }}
              >
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.accent.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  Try Interactive Gestures
                </Text>
              </View>
            </View>
          </IntelligentCard>

          {/* Dynamic Accent Showcase */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.content.cardOuter,
              marginTop: theme.spacing.content.section,
            }}
          >
            {[
              {
                icon: "🎨",
                title: "Dynamic\nAccents",
                subtitle: "State-dependent colors",
                accentType: "primary" as const,
              },
              {
                icon: "⚡",
                title: "60fps\nPhysics",
                subtitle: "Spring momentum",
                accentType: "primaryGlow" as const,
              },
              {
                icon: "🧠",
                title: "AI\nAdaptation",
                subtitle: "Context awareness",
                accentType: "primarySoft" as const,
              },
            ].map((item, index) => (
              <IntelligentCard
                key={index}
                variant="elevated"
                style={{ flex: 1, marginBottom: 0 }}
                bloomEnabled={bloomEnabled}
                momentumEnabled={momentumEnabled}
                adaptiveGlass={glassAdaptive}
                glassType={glassAdaptive ? "subtle" : "none"}
                onPress={() => handleCardPress(item.title.replace("\n", " "))}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: theme.device.isTablet ? 40 : 32,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    {item.icon}
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelXLarge
                        : theme.typography.material.labelXLarge,
                      {
                        color: colors.accent[item.accentType],
                        textAlign: "center",
                        marginBottom: theme.spacing.xxxs,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodySmall
                        : theme.typography.material.bodySmall,
                      {
                        color: colors.content.tertiary,
                        textAlign: "center",
                      },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </IntelligentCard>
            ))}
          </View>
        </View>

        {/* Award-Winning Principles */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineMedium
                : theme.typography.material.headlineMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
                marginTop: theme.spacing.content.section,
              },
            ]}
          >
            🏆 Award-Winning Principles
          </Text>

          <IntelligentCard
            variant="elevated"
            textContent={true}
            glassType={glassAdaptive ? "textHeavy" : "none"}
            bloomEnabled={false} // Disable bloom for text-heavy content
          >
            <View style={{ gap: theme.spacing.content.paragraph }}>
              {Object.entries(AwardWinningPrinciples).map(
                ([key, value], index) => (
                  <View key={key}>
                    <Text
                      style={[
                        isIOS
                          ? theme.typography.ios.labelLarge
                          : theme.typography.material.labelLarge,
                        {
                          color: colors.content.primary,
                          marginBottom: theme.spacing.xs,
                          textTransform: "capitalize",
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Text>
                    <Text
                      style={[
                        isIOS
                          ? theme.typography.ios.bodyMedium
                          : theme.typography.material.bodyMedium,
                        {
                          color: colors.content.secondary,
                          lineHeight: theme.device.isTablet ? 26 : 22,
                        },
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                )
              )}
            </View>
          </IntelligentCard>
        </View>

        {/* Device & Performance Info */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineMedium
                : theme.typography.material.headlineMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
                marginTop: theme.spacing.content.section,
              },
            ]}
          >
            📱 Device Intelligence
          </Text>

          <IntelligentCard
            variant="elevated"
            bloomEnabled={false}
            textContent={true}
            glassType="none"
          >
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Device Type: {theme.device.type} ({theme.device.width}×
                {theme.device.height})
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Platform: {Platform.OS} {Platform.Version}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Typography:{" "}
                {isIOS ? "SF Pro (Fluid Scaling)" : "Roboto (Fluid Scaling)"}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Glass: {isIOS ? "Native BlurView" : "Material Simulation"}{" "}
                {glassAdaptive ? "(Adaptive)" : "(Static)"}
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Animations: React Native Reanimated 3 (60fps)
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary },
                ]}
              >
                Touch Feedback: {bloomEnabled ? "Bloom + Haptics" : "Standard"}{" "}
                ({momentumEnabled ? "Momentum Enabled" : "Static"})
              </Text>
            </View>
          </IntelligentCard>
        </View>
      </MomentumScrollView>

      {/* Award-Winning Modal Demonstration */}
      <GestureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        variant={modalType}
        title="Award-Winning Modal"
        subtitle="Gesture dismissal with momentum physics and intelligent glass adaptation"
        gestureEnabled={gesturesEnabled}
        momentumReveal={momentumEnabled}
        intelligentGlass={glassAdaptive}
        bloomFeedback={bloomEnabled}
        glassType={glassAdaptive ? "adaptLight" : "medium"}
        textContent={false}
        haptic={true}
        accessibilityLabel="Demo modal showcasing award-winning design"
      >
        <View style={{ gap: theme.spacing.content.paragraph }}>
          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyXLarge
                : theme.typography.material.bodyXLarge,
              {
                color: colors.content.primary,
                lineHeight: theme.device.isTablet ? 36 : 32,
              },
            ]}
          >
            This modal demonstrates award-winning interaction design:
          </Text>

          <IntelligentCard
            variant="minimal"
            style={{ marginBottom: 0 }}
            bloomEnabled={bloomEnabled}
            textContent={true}
            glassType="none"
          >
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelXLarge
                    : theme.typography.material.labelXLarge,
                  {
                    color: colors.content.primary,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                🎯 Advanced Features Active
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.secondary, lineHeight: 28 },
                ]}
              >
                • Gesture dismissal{" "}
                {modalType === "sheet" ? "(swipe down)" : "(tap backdrop)"}
                {"\n"}• Context-aware glass adaptation{"\n"}• Momentum-based
                reveal animation{"\n"}• Fluid typography scaling{"\n"}•{" "}
                {bloomEnabled
                  ? "Bloom feedback enabled"
                  : "Standard touch feedback"}
                {"\n"}• Device-optimized physics
              </Text>
            </View>
          </IntelligentCard>

          <View
            style={{
              paddingVertical: theme.spacing.base,
              alignItems: "center",
            }}
          >
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyMedium
                  : theme.typography.material.bodyMedium,
                {
                  color: colors.content.tertiary,
                  textAlign: "center",
                  fontStyle: "italic",
                },
              ]}
            >
              {modalType === "sheet"
                ? "Swipe down or drag to dismiss with momentum"
                : "Tap backdrop with bloom feedback to close"}
            </Text>
          </View>
        </View>
      </GestureModal>
    </>
  );
};

export default AwardWinningDemoScreen;
