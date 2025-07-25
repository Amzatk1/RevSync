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
} from "react-native";
import { useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

import { PerformanceTracker } from "../config/monitoring";

const { width, height } = Dimensions.get("window");
const isIOS = Platform.OS === "ios";

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
  const scrollViewRef = useRef<ScrollView>(null);

  const onboardingPages: OnboardingPage[] = [
    {
      id: "welcome",
      title: "Welcome to RevSync",
      description: "Let's get you set up to unleash your bike's full potential.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Get Started",
    },
    {
      id: "ai_powered",
      title: "AI-Powered Tuning",
      subtitle: "Smart Technology",
      description: "Our advanced AI analyzes your bike and riding style to recommend the perfect tunes, ensuring optimal performance and safety.",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529", 
      descriptionColor: "#495057",
      buttonText: "Amazing!",
    },
    {
      id: "safety_first",
      title: "Safety First",
      subtitle: "Your Protection Matters", 
      description: "Every tune is verified for safety. Our AI performs comprehensive analysis to ensure modifications won't harm your engine or performance.",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057", 
      buttonText: "Got It",
    },
    {
      id: "your_garage",
      title: "Build Your Garage", 
      subtitle: "Manage Your Rides",
      description: "Add all your motorcycles to your digital garage. Track modifications, maintenance, and tune history for each bike.",
      image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Cool!",
    },
    {
      id: "discover_tunes",
      title: "Discover Perfect Tunes",
      subtitle: "Endless Possibilities", 
      description: "Browse thousands of verified tunes from creators worldwide. Filter by performance goals, riding style, and compatibility.",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa", 
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Awesome!",
    },
    {
      id: "join_community",
      title: "Join the Community",
      subtitle: "Connect with Riders",
      description: "Share experiences, ask questions, and learn from fellow motorcycle enthusiasts. Join discussions about tunes, bikes, and riding.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529", 
      descriptionColor: "#495057",
      buttonText: "Perfect!",
    },
    {
      id: "ready",
      title: "You're All Set!",
      subtitle: "Ready to Ride",
      description: "Welcome to the future of motorcycle tuning. Let's set up your profile and find your first perfect tune!",
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=400&fit=crop&crop=center",
      backgroundColor: "#f8f9fa",
      titleColor: "#212529",
      descriptionColor: "#495057",
      buttonText: "Let's Start!",
    },
  ];

  const handleNext = async () => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

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
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
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
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: page.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          {page.subtitle && (
            <Text style={[styles.subtitle, { color: "#0c7ff2" }]}>
              {page.subtitle}
            </Text>
          )}
          <Text style={[styles.title, { color: page.titleColor }]}>
            {page.title}
          </Text>
          <Text style={[styles.description, { color: page.descriptionColor }]}>
            {page.description}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {renderProgressDots()}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>
            {page.buttonText}
          </Text>
        </TouchableOpacity>
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
        onMomentumScrollEnd={(event) => {
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