import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector, useDispatch } from "react-redux";
import * as Haptics from "expo-haptics";

import {
  IntelligentCard,
  MomentumScrollView,
  GestureModal,
  AwardWinningTheme,
} from "../components/awardWinning";
import { RootState } from "../store";

interface SafeFlashScreenProps {
  route: {
    params: {
      tuneId: string;
      motorcycleId: string;
      purchaseId?: string;
    };
  };
  navigation: any;
}

interface FlashStage {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "pending" | "active" | "completed" | "error";
  progress: number;
}

export const SafeFlashScreen: React.FC<SafeFlashScreenProps> = ({
  route,
  navigation,
}) => {
  const theme = AwardWinningTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";
  const dispatch = useDispatch();

  const { tuneId, motorcycleId, purchaseId } = route.params;

  const [isFlashing, setIsFlashing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [completedModalVisible, setCompletedModalVisible] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const [flashStages, setFlashStages] = useState<FlashStage[]>([
    {
      id: "safety",
      title: "Safety Verification",
      description: "Checking safety parameters and permissions",
      icon: "shield-check",
      status: "pending",
      progress: 0,
    },
    {
      id: "backup",
      title: "ECU Backup",
      description: "Creating safety backup of current ECU state",
      icon: "content-save",
      status: "pending",
      progress: 0,
    },
    {
      id: "validation",
      title: "Tune Validation",
      description: "Validating tune compatibility and integrity",
      icon: "check-circle",
      status: "pending",
      progress: 0,
    },
    {
      id: "flashing",
    title: "Flashing ECU",
      description: "Writing new tune to ECU memory",
    icon: "flash",
      status: "pending",
      progress: 0,
    },
    {
      id: "verification",
      title: "Verification",
      description: "Verifying successful flash and functionality",
      icon: "check-decagram",
      status: "pending",
      progress: 0,
    },
  ]);

  const [tuneInfo, setTuneInfo] = useState({
    name: "Stage 2 Performance",
    creator: "ProTuner",
    version: "2.1.4",
    power_gain: "+25 HP",
    torque_gain: "+30 lb-ft",
    compatibility: "2020-2024 Yamaha R6",
    file_size: "2.4 MB",
    checksum: "a1b2c3d4",
  });

  const [motorcycleInfo, setMotorcycleInfo] = useState({
    make: "Yamaha",
    model: "R6",
    year: 2020,
    vin: "JYA1234567890",
    current_tune: "Stock ECU",
    ecu_type: "Bosch ME17",
    flash_count: 3,
  });

  useEffect(() => {
    // Show safety modal on mount
    setSafetyModalVisible(true);
  }, []);

  const updateStageProgress = (
    stageIndex: number,
    progress: number,
    status?: FlashStage["status"]
  ) => {
    setFlashStages((prev) =>
      prev.map((stage, index) =>
        index === stageIndex
          ? { ...stage, progress, status: status || stage.status }
          : stage
      )
    );
  };

  const startFlashProcess = async () => {
    if (isFlashing) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsFlashing(true);
    setCurrentStage(0);
    setOverallProgress(0);

    // Safety stage
    updateStageProgress(0, 0, "active");
    await simulateStageProgress(0, async (progress) => {
      updateStageProgress(0, progress);
      setOverallProgress(progress * 0.2);
    });
    updateStageProgress(0, 100, "completed");

    // Backup stage
    setCurrentStage(1);
    updateStageProgress(1, 0, "active");
    await simulateStageProgress(1, async (progress) => {
      updateStageProgress(1, progress);
      setOverallProgress(20 + progress * 0.2);
    });
    updateStageProgress(1, 100, "completed");

    // Validation stage
    setCurrentStage(2);
    updateStageProgress(2, 0, "active");
    await simulateStageProgress(2, async (progress) => {
      updateStageProgress(2, progress);
      setOverallProgress(40 + progress * 0.2);
    });
    updateStageProgress(2, 100, "completed");

    // Flashing stage (critical)
    setCurrentStage(3);
    updateStageProgress(3, 0, "active");
    await simulateStageProgress(3, async (progress) => {
      updateStageProgress(3, progress);
      setOverallProgress(60 + progress * 0.3);

      // Haptic feedback at critical points
      if (progress === 50) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    });
    updateStageProgress(3, 100, "completed");

    // Verification stage
    setCurrentStage(4);
    updateStageProgress(4, 0, "active");
    await simulateStageProgress(4, async (progress) => {
      updateStageProgress(4, progress);
      setOverallProgress(90 + progress * 0.1);
    });
    updateStageProgress(4, 100, "completed");

    // Completion
    setOverallProgress(100);
    setIsFlashing(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedModalVisible(true);
  };

  const simulateStageProgress = (
    stage: number,
    onProgress: (progress: number) => Promise<void>
  ) => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(async () => {
        progress += Math.random() * 15 + 5; // Variable progress speed
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          await onProgress(progress);
          resolve();
        } else {
          await onProgress(progress);
        }
      }, 200 + Math.random() * 300); // Variable timing for realism
    });
  };

  const getStageStatusColor = (status: FlashStage["status"]) => {
    switch (status) {
      case "active":
        return colors.accent.primary;
      case "completed":
        return colors.semantic.success;
      case "error":
        return colors.semantic.error;
      default:
        return colors.content.tertiary;
    }
  };

  const handleSafetyAccept = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSafetyModalVisible(false);
    setConfirmModalVisible(true);
  };

  const handleConfirmFlash = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfirmModalVisible(false);
    startFlashProcess();
  };

  const handleCancel = async () => {
    await Haptics.selectionAsync();
    if (isFlashing) {
    Alert.alert(
        "⚠️ Cancel Flash?",
        "Canceling during flash process may damage your ECU. Are you sure?",
      [
          { text: "Continue Flashing", style: "default" },
        {
            text: "Cancel Flash",
          style: "destructive",
          onPress: () => {
              setIsFlashing(false);
              navigation.goBack();
          },
        },
      ]
    );
    } else {
      navigation.goBack();
    }
  };

  const renderProgressIndicator = () => (
    <IntelligentCard
      variant="elevated"
      bloomEnabled={false}
      style={{
        marginHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.content.section,
      }}
    >
      <View style={{ gap: theme.spacing.base }}>
        {/* Overall Progress */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text
                style={[
                isIOS
                  ? theme.typography.ios.labelLarge
                  : theme.typography.material.labelLarge,
                { color: colors.content.primary, fontWeight: "600" },
              ]}
            >
              Overall Progress
            </Text>
            <Text
                  style={[
                isIOS
                  ? theme.typography.ios.labelLarge
                  : theme.typography.material.labelLarge,
                { color: colors.accent.primary, fontWeight: "600" },
              ]}
            >
              {Math.round(overallProgress)}%
            </Text>
          </View>

          <View
            style={{
              height: 8,
              backgroundColor: colors.content.backgroundElevated,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: colors.accent.primary,
                width: `${overallProgress}%`,
                borderRadius: 4,
              }}
                  />
                </View>
        </View>

        {/* Current Stage */}
        {isFlashing && (
          <View>
                  <Text
                    style={[
                isIOS
                  ? theme.typography.ios.labelMedium
                  : theme.typography.material.labelMedium,
                { color: colors.content.secondary },
              ]}
            >
              Current: {flashStages[currentStage]?.title}
                  </Text>
                </View>
        )}
        </View>
    </IntelligentCard>
  );

  const renderFlashStages = () => (
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
        Flash Process
      </Text>

      {flashStages.map((stage, index) => (
        <IntelligentCard
          key={stage.id}
          variant={stage.status === "active" ? "elevated" : "minimal"}
          bloomEnabled={false}
          style={{
            marginBottom: theme.spacing.content.cardOuter,
            borderLeftWidth: 4,
            borderLeftColor: getStageStatusColor(stage.status),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.base,
            }}
              >
                <Icon
              name={stage.icon}
                  size={24}
              color={getStageStatusColor(stage.status)}
            />

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
                {stage.title}
                </Text>

              <Text
            style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                {stage.description}
              </Text>

              {stage.status === "active" && (
                <View
                  style={{
                    height: 4,
                    backgroundColor: colors.content.backgroundElevated,
                    borderRadius: 2,
                    marginTop: theme.spacing.sm,
                    overflow: "hidden",
                  }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      backgroundColor: colors.accent.primary,
                      width: `${stage.progress}%`,
                      borderRadius: 2,
                    }}
                  />
                </View>
              )}
            </View>

            {stage.status === "active" && (
              <ActivityIndicator size="small" color={colors.accent.primary} />
            )}
            {stage.status === "completed" && (
              <Icon name="check" size={20} color={colors.semantic.success} />
            )}
            {stage.status === "error" && (
              <Icon name="alert" size={20} color={colors.semantic.error} />
            )}
          </View>
        </IntelligentCard>
      ))}
    </View>
  );

  const renderTuneInfo = () => (
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
        Tune Information
            </Text>

      <IntelligentCard
        variant="elevated"
        textContent={true}
        bloomEnabled={false}
        style={{ marginBottom: theme.spacing.content.section }}
      >
        <View style={{ gap: theme.spacing.base }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
            style={[
                isIOS
                  ? theme.typography.ios.headlineSmall
                  : theme.typography.material.headlineSmall,
                { color: colors.content.primary },
              ]}
            >
              {tuneInfo.name}
            </Text>
            <View
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                backgroundColor: colors.accent.primarySubtle,
                borderRadius: theme.spacing.xs,
              }}
            >
            <Text
              style={[
                  isIOS
                    ? theme.typography.ios.labelSmall
                    : theme.typography.material.labelSmall,
                  { color: colors.accent.primary, fontWeight: "600" },
                ]}
              >
                v{tuneInfo.version}
            </Text>
        </View>
      </View>

          <Text
          style={[
              isIOS
                ? theme.typography.ios.bodyLarge
                : theme.typography.material.bodyLarge,
              { color: colors.content.secondary },
            ]}
          >
            By {tuneInfo.creator}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.content.cardOuter,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelMedium
                    : theme.typography.material.labelMedium,
                  { color: colors.content.tertiary },
                ]}
              >
                Power Gain
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: colors.semantic.success, fontWeight: "600" },
                ]}
              >
                {tuneInfo.power_gain}
              </Text>
          </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelMedium
                    : theme.typography.material.labelMedium,
                  { color: colors.content.tertiary },
                ]}
              >
                Torque Gain
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: colors.semantic.success, fontWeight: "600" },
                ]}
              >
                {tuneInfo.torque_gain}
              </Text>
          </View>
          </View>
        </View>
      </IntelligentCard>
      </View>
    );

    return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.content.background,
      }}
      >
        {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.base,
          paddingVertical: theme.spacing.base,
        }}
      >
        <IntelligentCard
          variant="minimal"
          bloomEnabled={true}
          onPress={handleCancel}
          style={{
            marginBottom: 0,
            padding: theme.spacing.sm,
            borderRadius: theme.spacing.base,
          }}
        >
          <Icon name="arrow-left" size={24} color={colors.content.primary} />
        </IntelligentCard>

        <Text
          style={[
            isIOS
              ? theme.typography.ios.headlineSmall
              : theme.typography.material.headlineSmall,
            { color: colors.content.primary },
          ]}
        >
          Safe Flash
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <MomentumScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: theme.spacing.content.hero,
        }}
        rubberbandEnabled={!isFlashing}
        elasticOverscroll={!isFlashing}
        hapticFeedback={true}
        contentRevealStagger={true}
        intelligentBounce={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        {isFlashing && renderProgressIndicator()}

        {/* Tune Information */}
        {renderTuneInfo()}

        {/* Flash Stages */}
        {renderFlashStages()}

        {/* Action Button */}
        {!isFlashing && (
          <View style={{ paddingHorizontal: theme.spacing.base }}>
            <IntelligentCard
              variant="elevated"
              bloomEnabled={true}
              onPress={() => setSafetyModalVisible(true)}
              style={{
                marginBottom: 0,
                backgroundColor: colors.accent.primary,
                alignItems: "center",
                paddingVertical: theme.spacing.content.paragraph,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <Icon name="flash" size={24} color="#FFFFFF" />
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.headlineSmall
                      : theme.typography.material.headlineSmall,
                    { color: "#FFFFFF", fontWeight: "600" },
                  ]}
                >
                  Start Safe Flash
            </Text>
              </View>
            </IntelligentCard>
          </View>
        )}
      </MomentumScrollView>

      {/* Safety Modal */}
      <GestureModal
        visible={safetyModalVisible}
        onClose={() => setSafetyModalVisible(false)}
        variant="center"
        title="⚠️ Safety Warning"
        subtitle="Critical safety information"
        gestureEnabled={false}
        intelligentGlass={true}
        bloomFeedback={false}
        glassType="textHeavy"
        textContent={true}
        closeOnBackdrop={false}
      >
        <View style={{ gap: theme.spacing.content.paragraph }}>
          <IntelligentCard
            variant="minimal"
            style={{
              marginBottom: 0,
              backgroundColor: colors.semantic.warningBg,
              borderWidth: 1,
              borderColor: colors.semantic.warning,
            }}
            textContent={true}
          >
            <Text
            style={[
                isIOS
                  ? theme.typography.ios.bodyLarge
                  : theme.typography.material.bodyLarge,
                { color: colors.content.primary, lineHeight: 28 },
              ]}
            >
              • Flashing ECU modifies engine parameters{"\n"}• May void warranty
              and affect emissions compliance{"\n"}• Ensure engine is at
              operating temperature{"\n"}• Do not disconnect during flash
              process{"\n"}• Have professional installation if unsure
            </Text>
          </IntelligentCard>

          <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
            <IntelligentCard
              variant="minimal"
              bloomEnabled={true}
              onPress={() => setSafetyModalVisible(false)}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.content.border,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: colors.content.primary, fontWeight: "600" },
                ]}
              >
                Cancel
              </Text>
            </IntelligentCard>

            <IntelligentCard
              variant="elevated"
              bloomEnabled={true}
              onPress={handleSafetyAccept}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
                backgroundColor: colors.accent.primary,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: "#FFFFFF", fontWeight: "600" },
                ]}
              >
                I Understand
              </Text>
            </IntelligentCard>
          </View>
      </View>
      </GestureModal>

      {/* Confirmation Modal */}
      <GestureModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        variant="center"
        title="🏍️ Confirm Flash"
        subtitle={`${motorcycleInfo.make} ${motorcycleInfo.model} ${motorcycleInfo.year}`}
        gestureEnabled={true}
        intelligentGlass={true}
        bloomFeedback={true}
        glassType="medium"
        textContent={true}
      >
        <View style={{ gap: theme.spacing.content.paragraph }}>
          <IntelligentCard
            variant="minimal"
            style={{ marginBottom: 0 }}
            textContent={true}
          >
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyLarge
                    : theme.typography.material.bodyLarge,
                  { color: colors.content.primary },
                ]}
              >
                Ready to flash{" "}
                <Text style={{ fontWeight: "600" }}>{tuneInfo.name}</Text> to
                your {motorcycleInfo.make} {motorcycleInfo.model}?
              </Text>

              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  { color: colors.content.secondary },
                ]}
              >
                Current: {motorcycleInfo.current_tune}
                {"\n"}
                Flash Count: {motorcycleInfo.flash_count}
            </Text>
            </View>
          </IntelligentCard>

          <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
            <IntelligentCard
              variant="minimal"
              bloomEnabled={true}
              onPress={() => setConfirmModalVisible(false)}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.content.border,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: colors.content.primary, fontWeight: "600" },
                ]}
              >
                Cancel
            </Text>
            </IntelligentCard>

            <IntelligentCard
              variant="elevated"
              bloomEnabled={true}
              onPress={handleConfirmFlash}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
                backgroundColor: colors.accent.primary,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: "#FFFFFF", fontWeight: "600" },
                ]}
              >
                Flash Now
              </Text>
            </IntelligentCard>
          </View>
        </View>
      </GestureModal>

      {/* Completion Modal */}
      <GestureModal
        visible={completedModalVisible}
        onClose={() => {
          setCompletedModalVisible(false);
          navigation.goBack();
        }}
        variant="center"
        title="✅ Flash Complete!"
        subtitle="Tune successfully installed"
        gestureEnabled={true}
        intelligentGlass={true}
        bloomFeedback={true}
        glassType="medium"
        textContent={false}
      >
        <View
          style={{ gap: theme.spacing.content.paragraph, alignItems: "center" }}
        >
          <Icon name="check-circle" size={64} color={colors.semantic.success} />

          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyXLarge
                : theme.typography.material.bodyXLarge,
              {
                color: colors.content.primary,
                textAlign: "center",
                lineHeight: 32,
              },
            ]}
          >
            Your {motorcycleInfo.make} {motorcycleInfo.model} has been
            successfully flashed with{" "}
            <Text style={{ fontWeight: "600" }}>{tuneInfo.name}</Text>.
          </Text>

          <IntelligentCard
            variant="elevated"
            bloomEnabled={true}
            onPress={() => {
              setCompletedModalVisible(false);
              navigation.goBack();
            }}
            style={{
              marginBottom: 0,
              alignItems: "center",
              backgroundColor: colors.accent.primary,
              paddingHorizontal: theme.spacing.xl,
            }}
          >
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.labelLarge
                  : theme.typography.material.labelLarge,
                { color: "#FFFFFF", fontWeight: "600" },
              ]}
            >
              Continue
            </Text>
          </IntelligentCard>
          </View>
      </GestureModal>
    </SafeAreaView>
  );
};
