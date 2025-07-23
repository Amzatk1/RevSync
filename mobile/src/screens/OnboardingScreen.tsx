import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";

import { AwardWinningTheme as Theme } from "../styles/awardWinningTheme";
import { PerformanceTracker } from "../config/monitoring";
// import SmartBikeSearch from "../components/SmartBikeSearch"; // Temporarily commented out

const { width } = Dimensions.get("window");

interface OnboardingData {
  motorcycleType: string;
  selectedBike?: {
    id: number;
    name: string;
    manufacturer: { id: number; name: string };
    year: number;
    category: { id: number; name: string };
    displacement_cc: number;
    max_power_hp: number;
  } | null;
  skillLevel: string;
  ridingStyle: string[];
  goals: string[];
  experience: string;
}

interface OnboardingScreenProps {
  navigation: any;
  onComplete: (data: OnboardingData) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
  onComplete,
}) => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    motorcycleType: "",
    selectedBike: null,
    skillLevel: "",
    ridingStyle: [],
    goals: [],
    experience: "",
  });

  // 🏍️ Motorcycle types for LLM context
  const motorcycleTypes = [
    {
      id: "sport",
      name: "Sport",
      icon: "🏁",
      description: "Supersport, track-focused",
      examples: "R1, CBR1000RR, GSX-R1000",
    },
    {
      id: "naked",
      name: "Naked/Street",
      icon: "🏙️",
      description: "Urban riding, comfortable",
      examples: "MT-09, Z900, Street Triple",
    },
    {
      id: "touring",
      name: "Touring",
      icon: "🛣️",
      description: "Long-distance comfort",
      examples: "K1600GT, FJR1300, Concours",
    },
    {
      id: "adventure",
      name: "Adventure",
      icon: "🏔️",
      description: "On/off-road capability",
      examples: "GS1250, KTM Adventure, Africa Twin",
    },
    {
      id: "cruiser",
      name: "Cruiser",
      icon: "🛤️",
      description: "Relaxed, low-slung",
      examples: "Harley, Indian, Yamaha Bolt",
    },
    {
      id: "dirt",
      name: "Dirt/Motocross",
      icon: "🏜️",
      description: "Off-road racing",
      examples: "YZ450F, CRF450R, KX450",
    },
  ];

  // 🎯 Skill levels for LLM safety analysis
  const skillLevels = [
    {
      id: "beginner",
      name: "Beginner",
      icon: "🟢",
      description: "New to motorcycles or tuning",
      safety: "Conservative tunes, proven safe",
      duration: "< 2 years experience",
    },
    {
      id: "intermediate",
      name: "Intermediate",
      icon: "🟡",
      description: "Some experience, learning",
      safety: "Moderate performance gains",
      duration: "2-5 years experience",
    },
    {
      id: "advanced",
      name: "Advanced",
      icon: "🟠",
      description: "Experienced rider/tuner",
      safety: "Higher performance acceptable",
      duration: "5+ years experience",
    },
    {
      id: "expert",
      name: "Expert",
      icon: "🔴",
      description: "Professional/track rider",
      safety: "All performance levels",
      duration: "Professional level",
    },
  ];

  // 🏁 Riding styles for LLM personalization
  const ridingStyles = [
    {
      id: "commuting",
      name: "Daily Commuting",
      icon: "🚦",
      description: "City traffic, fuel efficiency",
      focus: "Smooth power, economy",
    },
    {
      id: "weekend",
      name: "Weekend Touring",
      icon: "🌄",
      description: "Long scenic rides",
      focus: "Comfort, reliability",
    },
    {
      id: "sport_street",
      name: "Sport Street",
      icon: "🏎️",
      description: "Spirited street riding",
      focus: "Performance, throttle response",
    },
    {
      id: "track",
      name: "Track Days",
      icon: "🏁",
      description: "Circuit racing, track events",
      focus: "Maximum performance",
    },
    {
      id: "off_road",
      name: "Off-Road",
      icon: "🏜️",
      description: "Trail riding, adventure",
      focus: "Torque, reliability",
    },
    {
      id: "drag",
      name: "Drag Racing",
      icon: "⚡",
      description: "Quarter mile, acceleration",
      focus: "Power, launch control",
    },
  ];

  // 🎯 Goals for LLM recommendation targeting
  const goals = [
    {
      id: "performance",
      name: "More Power",
      icon: "⚡",
      description: "Increase horsepower and torque",
    },
    {
      id: "efficiency",
      name: "Better MPG",
      icon: "⛽",
      description: "Improve fuel economy",
    },
    {
      id: "smoothness",
      name: "Smoother Ride",
      icon: "🌊",
      description: "Better throttle response",
    },
    {
      id: "reliability",
      name: "Reliability",
      icon: "🛡️",
      description: "Safe, proven modifications",
    },
    {
      id: "sound",
      name: "Better Sound",
      icon: "🔊",
      description: "Improve exhaust note",
    },
    {
      id: "racing",
      name: "Racing Edge",
      icon: "🏆",
      description: "Competitive advantage",
    },
  ];

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: "ridingStyle" | "goals", value: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      PerformanceTracker.trackMarketplaceEvent("onboarding_step_completed", {
        step: currentStep + 1,
        totalSteps: steps.length,
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // 🤖 Track completion for LLM training data
      PerformanceTracker.trackMarketplaceEvent("onboarding_completed", {
        motorcycleType: onboardingData.motorcycleType,
        selectedBike: onboardingData.selectedBike
          ? {
              id: onboardingData.selectedBike.id,
              name: onboardingData.selectedBike.name,
              manufacturer: onboardingData.selectedBike.manufacturer.name,
              year: onboardingData.selectedBike.year,
              category: onboardingData.selectedBike.category.name,
            }
          : null,
        skillLevel: onboardingData.skillLevel,
        ridingStyles: onboardingData.ridingStyle,
        goals: onboardingData.goals,
        timestamp: new Date().toISOString(),
      });

      // 📊 Send to backend for LLM profile creation
      await onComplete(onboardingData);

      Alert.alert(
        "🎉 Welcome to RevSync!",
        "Your AI-powered tune recommendations are ready! We'll suggest safe, personalized tunes based on your profile.",
        [
          {
            text: "Start Exploring!",
            onPress: () => navigation.replace("Main"),
          },
        ]
      );
    } catch (error) {
      console.error("Onboarding completion error:", error);
      Alert.alert("Error", "Failed to complete setup. Please try again.");
    }
  };

  // Step components
  const WelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Welcome to RevSync! 🏍️</Text>
      <Text style={styles.stepSubtitle}>
        Your AI-Powered Motorcycle Tuning Marketplace
      </Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Icon name="security" size={24} color={Theme.colors.accent.primary} />
          <Text style={styles.featureText}>AI Safety Analysis</Text>
        </View>
        <View style={styles.featureItem}>
          <Icon
            name="recommend"
            size={24}
            color={Theme.colors.accent.primary}
          />
          <Text style={styles.featureText}>Personalized Recommendations</Text>
        </View>
        <View style={styles.featureItem}>
          <Icon name="verified" size={24} color={Theme.colors.accent.primary} />
          <Text style={styles.featureText}>Verified Safe Tunes</Text>
        </View>
      </View>

      <Text style={styles.stepDescription}>
        Let's set up your profile so our AI can recommend the perfect tunes for
        your bike and riding style.
      </Text>
    </View>
  );

  const MotorcycleTypeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        What type of motorcycle do you ride? 🏍️
      </Text>
      <Text style={styles.stepDescription}>
        This helps our AI understand your bike's characteristics for safety
        analysis.
      </Text>

      <ScrollView
        style={styles.optionsList}
        showsVerticalScrollIndicator={false}
      >
        {motorcycleTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.optionCard,
              onboardingData.motorcycleType === type.id && styles.selectedCard,
            ]}
            onPress={() => updateData("motorcycleType", type.id)}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>{type.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{type.name}</Text>
                <Text style={styles.optionDescription}>{type.description}</Text>
                <Text style={styles.optionExamples}>
                  Examples: {type.examples}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const BikeSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Find your specific bike! 🔍</Text>
      <Text style={styles.stepDescription}>
        Help us give you the most accurate tune recommendations by selecting
        your exact motorcycle.
      </Text>

      {/* <SmartBikeSearch
        onBikeSelected={(bike) => {
          updateData("selectedBike", bike);
          // Auto-advance after selection with small delay for better UX
          setTimeout(() => {
            nextStep();
          }, 1000);
        }}
        onSkip={() => {
          updateData("selectedBike", null);
          nextStep();
        }}
        placeholder="Type your bike make or model (e.g., 'Du' for Ducati)..."
        showSkipOption={true}
      /> */}

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>🎯 Why select your bike?</Text>
        <View style={styles.benefitItem}>
          <Icon name="security" size={16} color={Theme.colors.accent.primary} />
          <Text style={styles.benefitText}>More accurate safety analysis</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="tune" size={16} color={Theme.colors.accent.primary} />
          <Text style={styles.benefitText}>
            Bike-specific tune recommendations
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="verified" size={16} color={Theme.colors.accent.primary} />
          <Text style={styles.benefitText}>Compatible modifications only</Text>
        </View>
      </View>
    </View>
  );

  const SkillLevelStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your experience level? 🎯</Text>
      <Text style={styles.stepDescription}>
        Our AI uses this for safety analysis - ensuring you get appropriate tune
        recommendations.
      </Text>

      <ScrollView
        style={styles.optionsList}
        showsVerticalScrollIndicator={false}
      >
        {skillLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionCard,
              onboardingData.skillLevel === level.id && styles.selectedCard,
            ]}
            onPress={() => updateData("skillLevel", level.id)}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>{level.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{level.name}</Text>
                <Text style={styles.optionDescription}>
                  {level.description}
                </Text>
                <Text style={styles.optionSafety}>Safety: {level.safety}</Text>
                <Text style={styles.optionDuration}>{level.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const RidingStyleStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How do you ride? 🏁</Text>
      <Text style={styles.stepDescription}>
        Select all that apply. Our AI will personalize recommendations for your
        riding style.
      </Text>

      <ScrollView
        style={styles.optionsList}
        showsVerticalScrollIndicator={false}
      >
        {ridingStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.optionCard,
              onboardingData.ridingStyle.includes(style.id) &&
                styles.selectedCard,
            ]}
            onPress={() => toggleArrayValue("ridingStyle", style.id)}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>{style.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{style.name}</Text>
                <Text style={styles.optionDescription}>
                  {style.description}
                </Text>
                <Text style={styles.optionFocus}>Focus: {style.focus}</Text>
              </View>
              {onboardingData.ridingStyle.includes(style.id) && (
                <Icon
                  name="check-circle"
                  size={24}
                  color={Theme.colors.accent.primary}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const GoalsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are your goals? 🎯</Text>
      <Text style={styles.stepDescription}>
        Select your priorities. Our AI will find tunes that match your
        objectives.
      </Text>

      <ScrollView
        style={styles.optionsList}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.optionCard,
              onboardingData.goals.includes(goal.id) && styles.selectedCard,
            ]}
            onPress={() => toggleArrayValue("goals", goal.id)}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>{goal.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{goal.name}</Text>
                <Text style={styles.optionDescription}>{goal.description}</Text>
              </View>
              {onboardingData.goals.includes(goal.id) && (
                <Icon
                  name="check-circle"
                  size={24}
                  color={Theme.colors.accent.primary}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const SummaryStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Perfect! 🎉</Text>
      <Text style={styles.stepDescription}>
        Our AI will now analyze thousands of tunes to find the perfect matches
        for your profile.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Profile:</Text>

        <View style={styles.summaryItem}>
          <Icon
            name="motorcycle"
            size={20}
            color={Theme.colors.accent.primary}
          />
          <Text style={styles.summaryText}>
            {onboardingData.selectedBike
              ? `${onboardingData.selectedBike.manufacturer.name} ${onboardingData.selectedBike.name} (${onboardingData.selectedBike.year})`
              : `${
                  motorcycleTypes.find(
                    (t) => t.id === onboardingData.motorcycleType
                  )?.name
                } Motorcycle`}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Icon name="star" size={20} color={Theme.colors.accent.primary} />
          <Text style={styles.summaryText}>
            {skillLevels.find((l) => l.id === onboardingData.skillLevel)?.name}{" "}
            Level
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Icon
            name="directions"
            size={20}
            color={Theme.colors.accent.primary}
          />
          <Text style={styles.summaryText}>
            {onboardingData.ridingStyle.length} Riding Style(s)
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Icon name="flag" size={20} color={Theme.colors.accent.primary} />
          <Text style={styles.summaryText}>
            {onboardingData.goals.length} Goal(s) Selected
          </Text>
        </View>
      </View>

      <View style={styles.aiFeatures}>
        <Text style={styles.aiFeaturesTitle}>🤖 Your AI Benefits:</Text>
        <Text style={styles.aiFeature}>
          ✅ Safety-verified tune recommendations
        </Text>
        <Text style={styles.aiFeature}>
          ✅ Personalized performance suggestions
        </Text>
        <Text style={styles.aiFeature}>
          ✅ Compatibility-checked modifications
        </Text>
        <Text style={styles.aiFeature}>
          ✅ Continuous learning from your preferences
        </Text>
      </View>
    </View>
  );

  const steps = [
    { component: WelcomeStep, canProceed: true },
    {
      component: MotorcycleTypeStep,
      canProceed: !!onboardingData.motorcycleType,
    },
    {
      component: BikeSelectionStep,
      canProceed: true, // This step is always optional - can skip
    },
    { component: SkillLevelStep, canProceed: !!onboardingData.skillLevel },
    {
      component: RidingStyleStep,
      canProceed: onboardingData.ridingStyle.length > 0,
    },
    { component: GoalsStep, canProceed: onboardingData.goals.length > 0 },
    { component: SummaryStep, canProceed: true },
  ];

  const CurrentStepComponent = steps[currentStep].component;
  const canProceed = steps[currentStep].canProceed;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.accent.primary, Theme.colors.accent.primaryDark]}
        style={styles.header}
      >
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CurrentStepComponent />
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Icon
              name="arrow-back"
              size={20}
              color={Theme.colors.content.primarySecondary}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.disabledButton]}
          onPress={isLastStep ? completeOnboarding : nextStep}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? "Start Using RevSync!" : "Continue"}
          </Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 18,
    color: Theme.colors.accent.primary,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  stepDescription: {
    fontSize: 16,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  featureText: {
    fontSize: 16,
    color: Theme.colors.content.primary,
    marginLeft: 12,
    fontWeight: "500",
  },
  optionsList: {
    maxHeight: 400,
  },
  optionCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: Theme.colors.accent.primary,
    backgroundColor: `${Theme.colors.accent.primary}10`,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginBottom: 2,
  },
  optionExamples: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    fontStyle: "italic",
  },
  optionSafety: {
    fontSize: 12,
    color: Theme.colors.accent.primary,
    fontWeight: "600",
  },
  optionDuration: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
  },
  optionFocus: {
    fontSize: 12,
    color: Theme.colors.accent.primary,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: Theme.colors.content.primary,
    marginLeft: 8,
  },
  aiFeatures: {
    backgroundColor: `${Theme.colors.accent.primary}15`,
    borderRadius: 12,
    padding: 16,
  },
  aiFeaturesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 8,
  },
  aiFeature: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: Theme.colors.content.backgroundElevated,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Theme.colors.content.primarySecondary,
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: Theme.colors.content.primarySecondary,
    opacity: 0.5,
  },
  benefitsContainer: {
    backgroundColor: `${Theme.colors.accent.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    marginLeft: 8,
    flex: 1,
  },
});

export default OnboardingScreen;
