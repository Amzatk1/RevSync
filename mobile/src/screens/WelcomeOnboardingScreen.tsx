import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { useDispatch } from "react-redux";
import type { ScrollViewProps } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

import { PerformanceTracker } from "../config/monitoring";

const { width, height } = Dimensions.get("window");
const isIOS = Platform.OS === "ios";

// Subtle motion for world‑class feel without changing layout
const contentOpacity = useRef(new Animated.Value(0)).current;
const contentTranslateY = useRef(new Animated.Value(12)).current;
const ctaScale = useRef(new Animated.Value(1)).current;

const runPageIntro = () => {
  contentOpacity.setValue(0);
  contentTranslateY.setValue(12);
  Animated.parallel([
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(contentTranslateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
};

interface WelcomeOnboardingScreenProps {
  navigation: any;
  onComplete: () => void;
}

interface OnboardingPage {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  backgroundColor: string;
  titleColor: string;
  descriptionColor: string;
  buttonText: string;
}

const WelcomeOnboardingScreen: React.FC<WelcomeOnboardingScreenProps> = ({
  navigation,
  onComplete,
}) => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  React.useEffect(() => {
    runPageIntro();
    // announce page change for screen readers
  }, [currentPage]);

  const onboardingPages: OnboardingPage[] = [
    {
      id: "welcome",
      title: "Welcome to RevSync",
      description: "Experience effortless motorcycle tuning and management, crafted for passionate riders. Get started in minutes—your best ride awaits.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Get Started",
    },
    {
      id: "ai_powered",
      title: "AI‑Powered Tuning",
      subtitle: "Smart Technology",
      description: "Let RevSync analyze your bike and riding habits to deliver personalized, optimized tunes—balancing peak performance and reliability.",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Amazing!",
    },
    {
      id: "safety_first",
      title: "Safety Comes Standard",
      subtitle: "Your Protection Matters",
      description: "Every adjustment is thoroughly checked for safety. RevSync’s advanced analysis helps protect your engine and keeps your ride dependable.",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Got It",
    },
    {
      id: "your_garage",
      title: "Your Digital Garage",
      subtitle: "Manage Your Rides",
      description: "Easily add your motorcycles, track modifications and service, and keep a seamless record of every tune—all in one place.",
      image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Cool!",
    },
    {
      id: "discover_tunes",
      title: "Explore World-Class Tunes",
      subtitle: "Endless Possibilities",
      description: "Browse a global library of verified tunes. Find the perfect match by filtering for your goals, riding style, and bike compatibility.",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Awesome!",
    },
    {
      id: "join_community",
      title: "Connect & Share",
      subtitle: "Join the RevSync Community",
      description: "Ask questions, share your results, and learn from real riders. Get inspired and grow with a passionate, global community.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Perfect!",
    },
    {
      id: "ready",
      title: "You’re Ready to Ride",
      subtitle: "Let’s Get Started",
      description: "Complete your profile and choose your first tune. Need help? Reach out to Amzat Karim at karimamzat26@gmail.com anytime.",
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Let’s Start!",
    },
  ];

  const handleNext = async () => {
    // Light haptic tap on press (iOS/Android where available)
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (currentPage < onboardingPages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Auto-scroll to next page
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });

      PerformanceTracker.trackMarketplaceEvent("welcome_onboarding_step", {
        step: nextPage + 1,
        pageId: onboardingPages[nextPage].id,
        totalSteps: onboardingPages.length,
      });
    } else {
      // Complete welcome onboarding and navigate to technical setup
      PerformanceTracker.trackMarketplaceEvent("welcome_onboarding_completed", {
        timestamp: new Date().toISOString(),
      });
      
      // Navigate to the technical onboarding (bike setup)
      navigation.navigate("Onboarding");
    }
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    runPageIntro();
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer} accessible accessibilityLabel={`Step ${currentPage + 1} of ${onboardingPages.length}`}>
      {onboardingPages.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentPage ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  const renderPage = (page: OnboardingPage, index: number) => (
    <View key={page.id} style={[styles.pageContainer, { backgroundColor: page.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>RevSync</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[styles.imageContainer, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}
          accessibilityIgnoresInvertColors
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${page.title} illustration`}
        >
          <Image
            source={{ uri: page.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View
          style={[styles.textContainer, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}
          accessible
          accessibilityRole="summary"
        >
          {page.subtitle && (
            <Text style={[styles.subtitle, { color: "#0c7ff2" }]} accessibilityRole="header">
              {page.subtitle}
            </Text>
          )}
          <Text style={[styles.title, { color: page.titleColor }]} accessibilityRole="header">
            {page.title}
          </Text>
          <Text style={[styles.description, { color: page.descriptionColor }]} allowFontScaling>
            {page.description}
          </Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {renderProgressDots()}
        <AnimatedTouchable
          style={[styles.continueButton, { transform: [{ scale: ctaScale }] }]}
          onPressIn={() => {
            Animated.spring(ctaScale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
          }}
          onPressOut={() => {
            Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
          }}
          onPress={handleNext}
          activeOpacity={0.9}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${page.buttonText} – ${page.title}`}
          testID={`onboarding-cta-${page.id}`}
        >
          <Text style={styles.continueButtonText}>{page.buttonText}</Text>
        </AnimatedTouchable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event: Parameters<NonNullable<ScrollViewProps['onMomentumScrollEnd']>>[0]) => {
          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          handlePageChange(pageIndex);
        }}
        scrollEnabled={false} // Disable manual scrolling, use button only
      >
        {onboardingPages.map((page, index) => renderPage(page, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  pageContainer: {
    width,
    height: height,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#212529",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    marginBottom: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroImage: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "#e6f2ff",
  },
  textContainer: {
    alignItems: "center",
    maxWidth: 320,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 34,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footer: {
    paddingBottom: isIOS ? 34 : 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    backgroundColor: "#0c7ff2",
  },
  progressDotInactive: {
    backgroundColor: "#d1d5db",
  },
  continueButton: {
    backgroundColor: "#0c7ff2",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#0c7ff2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default WelcomeOnboardingScreen;