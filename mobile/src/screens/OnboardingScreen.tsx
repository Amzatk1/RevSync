import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from "expo-haptics";
import AsyncStorage from '@react-native-async-storage/async-storage';

import SmartBikeSearch from '../components/SmartBikeSearch';
import { MotorcycleListItem } from '../services/motorcycleService';
import { useAuth } from '../auth/context/AuthContext';
import { Theme } from '../styles/theme';

const { width } = Dimensions.get('window');

// Simple icon component to replace Ionicons
const SimpleIcon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => {
  const getIconText = (iconName: string) => {
    switch (iconName) {
      case 'arrow-back': return '←';
      case 'checkmark': return '✓';
      case 'arrow-forward': return '→';
      case 'motorcycle': return '🏍️';
      case 'car': return '🚗';
      case 'timer': return '⏱️';
      case 'check': return '✓';
      default: return '•';
    }
  };

  return (
    <Text style={{ 
      fontSize: size, 
      color, 
      fontWeight: 'bold',
      textAlign: 'center',
      minWidth: size 
    }}>
      {getIconText(name)}
    </Text>
  );
};

interface OnboardingData {
  currentStep: number;
  motorcycleType: string;
  selectedBike: MotorcycleListItem | null;
  skillLevel: string;
  ridingStyle: string;
  goals: string[];
}

interface OnboardingScreenProps {
  onComplete?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { completeOnboarding } = useAuth();
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 0,
    motorcycleType: "",
    selectedBike: null,
    skillLevel: "",
    ridingStyle: "",
    goals: [],
  });

  const [isCompleting, setIsCompleting] = useState(false);

  // 🏍️ Motorcycle types for LLM context
  const motorcycleTypes = [
    {
      id: "sport",
      name: "Sportbike",
      icon: "🏁",
      description: "Supersport, track-focused",
      examples: "R1, CBR1000RR, GSX-R1000",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBm_Dypw3uBJiJI4CHSqO9L4a9nuAD6vCYyM2QF51qAS-KSC0jhAGP9yWKiw_NsYJ04AAUl0xoWDyNme-47RWES32yYcKbbenuX4y20CSaBJGVHEAgQTpYiaKig085-TJAcK1lV0g-wBIDcdAi9x9i3iLA8HTaKjBKtmeLfVopyDXf7T-eiIziFQHyKg6mS3PQuuG27zStZbu1FK35-ARjEF2dJfrCU63ZoMBh3pXOFQh6k7tDu6T2Vuxdz5QV5g3W0mszolfBZiQ"
    },
    {
      id: "cruiser",
      name: "Cruiser",
      icon: "🛤️",
      description: "Relaxed, low-slung",
      examples: "Harley, Indian, Yamaha Bolt",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5j-C_eOqOcm-HWVzOIIOWmehom2CyP6wdS6OmrMBted0vpo_dIZhYdkeBHkfGwkXc3i4Mm5WdX3hCPdkinPPFkmzExYY1-WYSxPUTzqcYrBm2h_lXPJxr0Zrxt-7GQcV-xwcGB2ux_acU2jddPFWsBoIGt2baXWxe3zGdvhSS6dJV6ehJDaYV_6fOwAOlooig-h89_vP7Oha_KcKy0AepMdOmkpw_upPg0GLV7EOlfyPrLAyA4CZa2N0sfmHC9LfNEmqDtxnjQ"
    },
    {
      id: "touring",
      name: "Touring",
      icon: "🛣️",
      description: "Long-distance comfort",
      examples: "K1600GT, FJR1300, Concours",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbTmDnx0YRsbJxlZTbW5KzLLuFg6SrMz6QPtFFPVSje7-p_47yj3ohivePaLP3A6JcM1BXH3fDsHqbuGc-Q-M8acy1dPfEphoeqJIj9wjNouEuW7ohOhOU0P8TPW2o75ga2pBelufuwQ1rfjzdZ5C5edBvhyYnMXm7wiyoReEKcK6CkJnzZU20mleNlqPrB1rmOUMQ0Vcvon40A4cifgUZss5YpogSPzDudhwHMPz-Moc-8yIOi6ldLzHU9QjnqJ6sN3_mrSHnzQ"
    },
    {
      id: "adventure",
      name: "Adventure",
      icon: "🏔️",
      description: "On/off-road capability",
      examples: "GS1250, KTM Adventure, Africa Twin",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDT7GSSH8LrQZ1eB2afYC9QOtgDi1P3Uvr8b8MVxNNrrlmdNjO_U_EPWjR47plYkV3Bbi8u0BFzGkKfLL7ZCNV8kN7TV6lVcktPz-jAAm0aCuTg6Oi82NBLCHhAxSOK6ml-58dGO_VvbeJq59sysynnALj4WrdA_EpR63MzD5b5NZQiiynAKwIJ2udS1tJ0bE0bhbNmx12w0qDDty0Ds0PfMnIOjF4S_mEpRxDGROHzPo6HPOA-Kj--Mlm05-TmDb-O7ilH36KUdw"
    },
    {
      id: "standard",
      name: "Standard",
      icon: "🏙️",
      description: "Urban riding, comfortable",
      examples: "MT-09, Z900, Street Triple",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoV_tevSAMgAY065vTB0-4R1G0lg99U-FesBZQmnf-P7i2XOD68x5nFXdPJZL4mkyPdbfscohm3wa9k47WfuXJ-yUBYrhBVj799jqnYXTfehfu_eKaXo4JWPgdxaPSB6CmnwpRxIDeJV092qzY5DXNk0mZaaSMoLH-z3dv6467MBNkagwf5N7sN2-5ev5hYREUvQmjKZuvxUDcsmieGDeaPtVIytS08m893zXa3KDaDhFBO2-3EL_uSOVoOn8Cr8IKoxK19albbA"
    },
    {
      id: "other",
      name: "Other",
      icon: "🏜️",
      description: "Other motorcycle types",
      examples: "YZ450F, CRF450R, KX450",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZV9bPfkkZZSc5hyxhbQTtV7iH0yOJ6nmKaMVpagTuL0Y_EEQ42ngZhAIiM_8AAi3tNW_JE30WjbSwyhxx_wKIgZOj3eNLxlr2Bkqc29UezcpquCh4am17fCkKecFiAibLtjS74Fc-vjyoi5WGC-DZ5zU31dlnnkaoFYQ_WUC-y8UjfcOMY8h8THpClj5-7Rb90GMU7_7P5-QU0TP74gTq_lclSLbeEu6p3W3YUowjQNAAOWmdEgLLfJmS-DipeeJLVD6adwid4A"
    },
  ];

  // 🎯 Skill levels for LLM safety analysis
  const skillLevels = [
    {
      id: "beginner",
      name: "Beginner",
      description: "New to riding or have limited experience.",
    },
    {
      id: "intermediate",
      name: "Intermediate",
      description: "Comfortable with basic riding skills and some experience.",
    },
    {
      id: "advanced",
      name: "Advanced",
      description: "Experienced rider with advanced skills and confidence.",
    },
  ];

  // 🎯 Riding styles with enhanced descriptions for better LLM context
  const ridingStyles = [
    {
      id: "casual",
      title: "Casual Cruising",
      description: "Relaxed rides, scenic routes, and leisurely pace",
    },
    {
      id: "commuting",
      title: "Daily Commuting",
      description: "City riding, traffic navigation, fuel efficiency",
    },
    {
      id: "sport",
      title: "Sport Riding",
      description: "Performance-focused, spirited rides, handling",
    },
    {
      id: "touring",
      title: "Long Distance Touring",
      description: "Extended journeys, comfort, reliability",
    },
    {
      id: "track",
      title: "Track Days",
      description: "Racing circuits, maximum performance, lap times",
    },
    {
      id: "adventure",
      title: "Adventure Riding",
      description: "Off-road exploration, dual-sport adventures",
    },
  ];

  // 🎯 Goals for LLM recommendation targeting
  const goals = [
    {
      id: "performance",
      name: "Improve Performance",
      description: "Unlock your bike's full potential.",
    },
    {
      id: "efficiency",
      name: "Increase Fuel Efficiency",
      description: "Go further on every tank.",
    },
    {
      id: "track",
      name: "Improve Track Times",
      description: "Shave seconds off your lap.",
    },
  ];

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: "goals", value: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const nextStep = () => {
    if (onboardingData.currentStep < 6) { // Assuming 6 steps for now
      setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (onboardingData.currentStep > 0) {
      setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      // 🔍 Validate all required data before completion
      if (!validateOnboardingData(onboardingData)) {
        const incompleteStep = findIncompleteStep(onboardingData);
        if (incompleteStep !== -1) {
          setOnboardingData((prev) => ({ ...prev, currentStep: incompleteStep }));
        }
        return;
      }

      setIsCompleting(true);
      
      const result = await completeOnboarding({
        motorcycleType: onboardingData.motorcycleType,
        skillLevel: onboardingData.skillLevel,
        ridingStyle: onboardingData.ridingStyle,
        selectedBike: onboardingData.selectedBike,
        performanceGoals: onboardingData.goals,
      });

      if (result.success) {
        Alert.alert(
          "Welcome to RevSync!",
          "Your profile has been created successfully. You can now access all features.",
          [{ text: "Continue", onPress: () => onComplete?.() }]
        );
      } else {
        Alert.alert(
          "Profile Creation Error",
          result.error || "Failed to save your profile. Please try again.",
          [{ text: "Try Again" }]
        );
      }

      setIsCompleting(false);

    } catch (error) {
      console.error("Onboarding completion error:", error);
      Alert.alert(
        "Connection Error", 
        "We couldn't save your profile right now. Your data is saved locally and we'll sync it when possible.",
        [
          { text: "Continue", onPress: () => onComplete?.() },
          { text: "Try Again", onPress: handleCompleteOnboarding }
        ]
      );
      setIsCompleting(false);
    }
  };

  const validateOnboardingData = (data: OnboardingData): string[] => {
    const errors: string[] = [];
    
    if (!data.motorcycleType) {
      errors.push("• Select your motorcycle type");
    }
    if (!data.skillLevel) {
      errors.push("• Choose your skill level");
    }
    if (!data.ridingStyle) {
      errors.push("• Pick your riding style");
    }
    if (data.goals.length === 0) {
      errors.push("• Select at least one goal");
    }
    
    return errors;
  };

  const findIncompleteStep = (data: OnboardingData): number => {
    if (!data.motorcycleType) return 1;
    if (!data.skillLevel) return 3;
    if (!data.ridingStyle) return 4;
    if (data.goals.length === 0) return 5;
    return -1;
  };

  // Step components
  const WelcomeStep = () => (
    <View style={styles.welcomeContainer}>
      {/* Hero Image Section */}
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop&crop=center"
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
      </View>

      {/* Content Section */}
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>Welcome to RevSync</Text>
        <Text style={styles.welcomeDescription}>
          Discover, purchase, and apply engine tunes to your motorcycle with ease. 
          Unleash your bike's true potential.
        </Text>
      </View>
    </View>
  );

  const MotorcycleTypeStep = () => (
    <View style={styles.motorcycleTypeContainer}>
      {/* Enhanced Header with Back Button and Progress */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#111418" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Motorcycle Type</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Progress Dots */}
        <View style={styles.progressDotsContainer}>
          {/* Assuming 6 steps for now */}
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                onboardingData.currentStep === index ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.motorcycleTypeContent}>
        <View style={styles.motorcycleTypeHeader}>
          <Text style={styles.motorcycleTypeTitle}>
            What type of motorcycle do you have?
          </Text>
          <Text style={styles.motorcycleTypeDescription}>
            Select the type that best describes your motorcycle.
          </Text>
        </View>

        {/* Grid of motorcycle types */}
        <View style={styles.motorcycleTypeGrid}>
          {motorcycleTypes.slice(0, 6).map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.motorcycleTypeCard,
                onboardingData.motorcycleType === type.id && styles.motorcycleTypeCardSelected,
              ]}
              onPress={() => {
                updateData("motorcycleType", type.id);
                // Add haptic feedback for better UX
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: type.imageUrl }}
                style={styles.motorcycleTypeImage}
                resizeMode="cover"
              />
              <Text style={styles.motorcycleTypeLabel}>{type.name}</Text>
              {onboardingData.motorcycleType === type.id && (
                <View style={styles.selectedIndicator}>
                  <SimpleIcon name="checkmark" size={16} color="#0b80ee" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const BikeSelectionStep = () => (
    <View style={styles.bikeSearchContainer}>
      {/* Enhanced Header with Back Button */}
      <View style={styles.bikeSearchHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#111418" />
          </TouchableOpacity>
          <Text style={styles.bikeSearchHeaderTitle}>Bike Search</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.bikeSearchContent}>
        <SmartBikeSearch
          onBikeSelected={(bike) => {
            updateData("selectedBike", bike);
            // Track manual vs database bike selection
            // PerformanceTracker.trackMarketplaceEvent("onboarding_bike_selected", {
            //   bike_id: bike.id,
            //   manufacturer: bike.manufacturer.name,
            //   model: bike.model_name,
            //   year: bike.year,
            //   is_manual_entry: bike.id?.toString().startsWith('manual_') || false,
            // });
            
            // Add haptic feedback
            if (Platform.OS === "ios") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            // Auto-advance after selection with small delay for better UX
            setTimeout(() => {
              nextStep();
            }, 1000);
          }}
          onManualBikeAdded={(manualBike) => {
            // Track manual bike addition for analytics
            // PerformanceTracker.trackMarketplaceEvent("onboarding_manual_bike_added", {
            //   manufacturer: manualBike.manufacturer.name,
            //   model: manualBike.model_name,
            //   year: manualBike.year,
            //   has_displacement: !!manualBike.engine_displacement_cc,
            // });
          }}
          onSkip={() => {
            updateData("selectedBike", null);
            // PerformanceTracker.trackMarketplaceEvent("onboarding_bike_skipped", {});
            nextStep();
          }}
          placeholder="Search by make or model"
          showSkipOption={true}
          initialQuery=""
        />
      </View>
    </View>
  );

  const SkillLevelStep = () => (
    <View style={styles.skillLevelContainer}>
      {/* Enhanced Header with Back Button */}
      <View style={styles.skillLevelHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#111418" />
          </TouchableOpacity>
          <Text style={styles.skillLevelHeaderTitle}>Skill Level</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.skillLevelContent}>
        <View style={styles.skillLevelTextHeader}>
          <Text style={styles.skillLevelTitle}>
            How would you describe your riding experience?
          </Text>
          <Text style={styles.skillLevelDescription}>
            Selecting the right skill level ensures you receive tunes that match your abilities, enhancing safety and performance.
          </Text>
        </View>

        {/* Skill Level Options */}
        <View style={styles.skillLevelOptions}>
          {skillLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.skillLevelCard,
                onboardingData.skillLevel === level.id && styles.skillLevelCardSelected,
              ]}
              onPress={() => {
                updateData("skillLevel", level.id);
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.skillLevelCardContent}>
                <Text style={styles.skillLevelCardTitle}>{level.name}</Text>
                <Text style={styles.skillLevelCardDescription}>
                  {level.description}
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                onboardingData.skillLevel === level.id && styles.radioButtonSelected,
              ]}>
                {onboardingData.skillLevel === level.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const RidingStyleStep = () => (
    <View style={styles.ridingStyleContainer}>
      {/* Enhanced Header with Back Button */}
      <View style={styles.ridingStyleHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#111418" />
          </TouchableOpacity>
          <Text style={styles.ridingStyleHeaderTitle}>Riding Style</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.ridingStyleContent}>
        <Text style={styles.ridingStyleDescription}>
          Select your riding style to help us recommend the best tunes for you.
        </Text>

        {/* Riding Style Options */}
        <View style={styles.ridingStyleOptions}>
          {ridingStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.ridingStyleCard,
                onboardingData.ridingStyle === style.id && styles.ridingStyleCardSelected,
              ]}
              onPress={() => {
                updateData("ridingStyle", style.id);
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.ridingStyleCardContent}>
                <Text style={styles.ridingStyleCardTitle}>{style.title}</Text>
                <Text style={styles.ridingStyleCardDescription}>
                  {style.description}
                </Text>
              </View>
              {onboardingData.ridingStyle === style.id && (
                <View style={styles.ridingStyleSelectedIndicator}>
                  <SimpleIcon name="checkmark" size={16} color="#0b80ee" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const GoalsStep = () => (
    <View style={styles.goalsContainer}>
      {/* Enhanced Header with Back Button */}
      <View style={styles.goalsHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#111418" />
          </TouchableOpacity>
          <Text style={styles.goalsHeaderTitle}>Your Goals</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.goalsContent}>
        <View style={styles.goalsTextHeader}>
          <Text style={styles.goalsTitle}>
            What are your goals?
          </Text>
          <Text style={styles.goalsDescription}>
            Select all that apply. This helps us personalize your experience.
          </Text>
        </View>

        {/* Goals Options */}
        <View style={styles.goalsOptions}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalsCard,
                onboardingData.goals.includes(goal.id) && styles.goalsCardSelected,
              ]}
              onPress={() => {
                toggleArrayValue("goals", goal.id);
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.goalsCardContent}>
                <Text style={styles.goalsCardTitle}>{goal.name}</Text>
                <Text style={styles.goalsCardDescription}>
                  {goal.description}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                onboardingData.goals.includes(goal.id) && styles.checkboxSelected,
              ]}>
                {onboardingData.goals.includes(goal.id) && (
                  <SimpleIcon name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const SummaryStep = () => (
    <View style={styles.summaryContainer}>
      {/* Enhanced Header with Back Button */}
      <View style={styles.summaryHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
            activeOpacity={0.7}
          >
            <SimpleIcon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.summaryHeaderTitle}>Summary</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.summaryContent}>
        <Text style={styles.summaryMainTitle}>
          Review Your Selections
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryReviewCard}>
            <Text style={styles.summaryLabel}>Motorcycle</Text>
            <Text style={styles.summaryValue}>
              {onboardingData.selectedBike
                ? `${onboardingData.selectedBike.manufacturer.name} ${onboardingData.selectedBike.model_name}`
                : motorcycleTypes.find(t => t.id === onboardingData.motorcycleType)?.name || "Not selected"}
            </Text>
          </View>

          <View style={styles.summaryReviewCard}>
            <Text style={styles.summaryLabel}>Skill Level</Text>
            <Text style={styles.summaryValue}>
              {skillLevels.find(l => l.id === onboardingData.skillLevel)?.name || "Not selected"}
            </Text>
          </View>

          <View style={styles.summaryReviewCard}>
            <Text style={styles.summaryLabel}>Riding Style</Text>
            <Text style={styles.summaryValue}>
              {ridingStyles.find(s => s.id === onboardingData.ridingStyle)?.title || "Not selected"}
            </Text>
          </View>

                     <View style={styles.summaryReviewCard}>
             <Text style={styles.summaryLabel}>Goals</Text>
             <Text style={styles.summaryValue}>
               {onboardingData.goals.length > 0 
                 ? goals.filter(g => onboardingData.goals.includes(g.id)).map(g => g.name).join(", ")
                 : "None selected"}
             </Text>
           </View>
         </View>
       </View>

       {/* Summary Footer */}
       <View style={styles.summaryFooter}>
         <TouchableOpacity
           style={styles.summaryCompleteButton}
           onPress={handleCompleteOnboarding}
           activeOpacity={0.8}
           disabled={isCompleting}
         >
           {isCompleting ? (
             <ActivityIndicator color="#FFFFFF" />
           ) : (
             <Text style={styles.summaryCompleteButtonText}>
               Complete Onboarding
             </Text>
           )}
         </TouchableOpacity>
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
      canProceed: !!onboardingData.ridingStyle,
    },
    { component: GoalsStep, canProceed: onboardingData.goals.length > 0 },
    { component: SummaryStep, canProceed: true },
  ];

  const CurrentStepComponent = steps[onboardingData.currentStep].component;
  const canProceed = steps[onboardingData.currentStep].canProceed;
  const isLastStep = onboardingData.currentStep === steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* <TypedLinearGradient
      //   colors={[Theme.colors.accent.primary, Theme.colors.accent.primaryDark]}
      //   style={styles.header}
      // >
      //   <View style={styles.progressContainer}>
      //     <Text style={styles.progressText}>
      //       Step {onboardingData.currentStep + 1} of {steps.length}
      //     </Text>
      //     <View style={styles.progressBar}>
      //       <View
      //         style={[
      //           styles.progressFill,
      //           { width: `${((onboardingData.currentStep + 1) / steps.length) * 100}%` },
      //         ]}
      //       />
      //     </View>
      //   </View>
      // </TypedLinearGradient> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CurrentStepComponent />
      </ScrollView>

      {!isLastStep && (
        <View style={styles.footer}>
          {onboardingData.currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <SimpleIcon
                name="arrow-back"
                size={20}
                color={Theme.colors.content.secondary}
              />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.disabledButton]}
            onPress={nextStep}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>
              {onboardingData.currentStep === 0 ? "Get Started" : "Continue"}
            </Text>
            {onboardingData.currentStep !== 0 && (
              <SimpleIcon name="arrow-forward" size={20} color={"#FFFFFF"} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Match HTML background color
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

  // Welcome Screen Styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  heroSection: {
    height: "60%",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(249,249,249,0.8)",
  },
  welcomeContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f9f9f9",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    marginTop: -64,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#637488",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto", 
      default: "System",
    }),
  },

  // Motorcycle Type Step Styles
  motorcycleTypeContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  motorcycleTypeContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  motorcycleTypeHeader: {
    alignItems: "flex-start",
    marginBottom: 24,
  },
  motorcycleTypeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 8,
    lineHeight: 32,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  motorcycleTypeDescription: {
    fontSize: 16,
    color: "#637488",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  motorcycleTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  motorcycleTypeCard: {
    width: (width - 48) / 2, // Account for padding and gap
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 140,
  },
  motorcycleTypeCardSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#e0e7ff",
    shadowColor: "#0b80ee",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  motorcycleTypeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  motorcycleTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // Enhanced Header Styles
  enhancedHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  headerSpacer: {
    width: 24,
  },
  progressDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  progressDot: {
    height: 6,
    width: 32,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: "#0b80ee",
  },
  progressDotInactive: {
    backgroundColor: "#E0E0E0",
  },

  // Bike Search Step Styles
  bikeSearchContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  bikeSearchHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bikeSearchHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  bikeSearchContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Skill Level Step Styles
  skillLevelContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  skillLevelHeader: {
    backgroundColor: "#f9f9f9",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  skillLevelHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  skillLevelContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  skillLevelTextHeader: {
    marginBottom: 32,
  },
  skillLevelTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 8,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  skillLevelDescription: {
    fontSize: 16,
    color: "#637488",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  skillLevelOptions: {
    gap: 16,
  },
  skillLevelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  skillLevelCardSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#e0e7ff",
    shadowColor: "#0b80ee",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  skillLevelCardContent: {
    flex: 1,
  },
  skillLevelCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  skillLevelCardDescription: {
    fontSize: 14,
    color: "#637488",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#0b80ee",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  // Riding Style Step Styles
  ridingStyleContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  ridingStyleHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ridingStyleHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  ridingStyleContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  ridingStyleDescription: {
    fontSize: 16,
    color: "#637488",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  ridingStyleOptions: {
    gap: 16,
  },
  ridingStyleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ridingStyleCardSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#e0e7ff",
  },
  ridingStyleCardContent: {
    flex: 1,
  },
  ridingStyleCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  ridingStyleCardDescription: {
    fontSize: 14,
    color: "#637488",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  ridingStyleIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ridingStyleSelectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // Goals Step Styles
  goalsContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  goalsHeader: {
    backgroundColor: "#f9f9f9",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  goalsHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111418",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  goalsContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  goalsTextHeader: {
    marginBottom: 32,
  },
  goalsTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 8,
    lineHeight: 40,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  goalsDescription: {
    fontSize: 16,
    color: "#637488",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  goalsOptions: {
    gap: 16,
  },
  goalsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  goalsCardSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#e0e7ff",
    shadowColor: "#0b80ee",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  goalsCardContent: {
    flex: 1,
  },
  goalsCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  goalsCardDescription: {
    fontSize: 14,
    color: "#637488",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  checkboxSelected: {
    borderColor: "#0b80ee",
    backgroundColor: "#0b80ee",
  },

  // Summary Step Styles
  summaryContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  summaryHeader: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  summaryHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  summaryContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  summaryMainTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  summaryCards: {
    gap: 16,
  },
  summaryReviewCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666666",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  summaryFooter: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "#ffffff",
  },
  summaryCompleteButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#dce8f3",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCompleteButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
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
    color: Theme.colors.content.secondary,
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
    color: Theme.colors.content.secondary,
    marginBottom: 2,
  },
  optionExamples: {
    fontSize: 12,
    color: Theme.colors.content.secondary,
    fontStyle: "italic",
  },
  optionSafety: {
    fontSize: 12,
    color: Theme.colors.accent.primary,
    fontWeight: "600",
  },
  optionDuration: {
    fontSize: 12,
    color: Theme.colors.content.secondary,
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Account for safe area
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Theme.colors.content.secondary,
    marginLeft: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b80ee", // Match HTML primary color
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50, // rounded-full equivalent
    minHeight: 56,
    width: "100%",
    shadowColor: "#0b80ee",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "700", // Increased font weight
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  disabledButton: {
    backgroundColor: Theme.colors.content.secondary,
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