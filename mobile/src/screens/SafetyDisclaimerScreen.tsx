import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

// Simple icon component to replace vector icons
const SimpleIcon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => {
  const getIconText = (iconName: string) => {
    switch (iconName) {
      case 'shield-alert': return '🛡️';
      case 'alert': return '⚠️';
      case 'check': return '✓';
      case 'help-circle': return '❓';
      case 'arrow-right': return '→';
      case 'arrow-down': return '↓';
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

import { Theme } from "../styles/theme";

const { height } = Dimensions.get("window");

interface SafetyDisclaimerScreenProps {
  route?: {
    params?: {
      mandatory?: boolean;
      returnTo?: string;
    };
  };
  navigation?: any;
}

const SafetyDisclaimerScreen: React.FC<SafetyDisclaimerScreenProps> = ({
  route,
  navigation,
}) => {
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedCompliance, setAcceptedCompliance] = useState(false);
  const [acceptedProfessional, setAcceptedProfessional] = useState(false);

  const mandatory = route?.params?.mandatory ?? true;
  const returnTo = route?.params?.returnTo;

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      if (!hasScrolledToBottom) {
        setHasScrolledToBottom(true);
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
  };

  const handleAcceptanceChange = async (type: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    switch (type) {
      case "risks":
        setAcceptedRisks(!acceptedRisks);
        break;
      case "legal":
        setAcceptedLegal(!acceptedLegal);
        break;
      case "compliance":
        setAcceptedCompliance(!acceptedCompliance);
        break;
      case "professional":
        setAcceptedProfessional(!acceptedProfessional);
        break;
    }

    // Save progress
    try {
      await AsyncStorage.setItem(
        "safety_disclaimer_progress",
        JSON.stringify({
          acceptedRisks,
          acceptedLegal,
          acceptedCompliance,
          acceptedProfessional,
          hasScrolledToBottom,
        })
      );
    } catch (error) {
      console.log("Error saving progress:", error);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Choose how you'd like to contact our safety team:",
      [
        {
          text: "Call Safety Hotline",
          onPress: () => Linking.openURL("tel:+1-555-123-XXXX"),
        },
        {
          text: "Email Safety Team",
          onPress: () =>
            Linking.openURL("mailto:safety@yourcompany.com?subject=Safety Question"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const canProceed = () => {
    return (
      acceptedRisks &&
      acceptedLegal &&
      acceptedCompliance &&
      acceptedProfessional &&
      hasScrolledToBottom
    );
  };

  const handleAccept = async () => {
    if (!canProceed()) {
      Alert.alert(
        "Incomplete Acknowledgment",
        "Please scroll through the entire disclaimer and accept all terms before proceeding."
      );
      return;
    }

    try {
      await AsyncStorage.setItem("safety_disclaimer_accepted", "true");
      await AsyncStorage.setItem(
        "safety_disclaimer_date",
        new Date().toISOString()
      );

      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Safety Disclaimer Accepted",
        "Thank you for acknowledging our safety guidelines. Please ride safely!",
        [
          {
            text: "Continue",
            onPress: () => {
              if (navigation && returnTo) {
                navigation.navigate(returnTo);
              } else if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save acceptance. Please try again.");
    }
  };

  const handleDecline = () => {
    Alert.alert(
      "Disclaimer Required",
      mandatory
        ? "You must accept the safety disclaimer to use tuning features."
        : "Are you sure you want to decline? Some features may be limited.",
      mandatory
        ? [{ text: "OK" }]
        : [
            { text: "Yes, Decline", onPress: () => navigation?.goBack() },
            { text: "Review Again", style: "cancel" },
          ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FF6B6B' }]}>
        <View style={styles.headerContent}>
          <SimpleIcon name="shield-alert" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Safety First</Text>
          <Text style={styles.headerSubtitle}>
            Motorcycle Tuning Safety Disclaimer
          </Text>
        </View>
      </View>

      {/* Disclaimer Content */}
      <ScrollView style={styles.content} onScroll={handleScroll}>
        <View style={styles.warningBox}>
          <SimpleIcon name="alert" size={24} color="#FF3B30" />
          <Text style={styles.warningText}>
            CRITICAL SAFETY WARNING: Motorcycle ECU tuning involves significant
            risks. Please read carefully.
          </Text>
        </View>

        {/* Risk Acknowledgment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ PERFORMANCE RISKS</Text>
          <Text style={styles.sectionContent}>
            Engine modifications can cause:
            {"\n"}• Catastrophic engine failure
            {"\n"}• Transmission damage
            {"\n"}• Brake system stress
            {"\n"}• Suspension component failure
            {"\n"}• Tire degradation and blowouts
            {"\n"}• Loss of vehicle control
            {"\n"}• Fire and explosion risks
            {"\n"}• Environmental damage
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏛️ LEGAL COMPLIANCE</Text>
          <Text style={styles.sectionContent}>
            You are responsible for ensuring modifications comply with:
            {"\n"}• Federal EPA regulations
            {"\n"}• State and local emissions laws  
            {"\n"}• CARB compliance requirements
            {"\n"}• DOT safety standards
            {"\n"}• Insurance policy requirements
            {"\n"}• Vehicle registration laws
            {"\n"}• Roadworthiness certifications
            {"\n"}• Noise ordinances
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 TECHNICAL LIMITATIONS</Text>
          <Text style={styles.sectionContent}>
            Our AI recommendations have limitations:
            {"\n"}• May not account for wear/damage
            {"\n"}• Cannot predict individual riding styles
            {"\n"}• Based on general motorcycle data
            {"\n"}• May not reflect latest safety recalls
            {"\n"}• Cannot guarantee compatibility
            {"\n"}• May not account for aftermarket parts
            {"\n"}• Limited real-world testing data
            {"\n"}• Regional fuel variations not considered
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🔧 PROFESSIONAL REQUIREMENTS</Text>
          <Text style={styles.sectionContent}>
            ECU modifications should only be performed by:
            {"\n"}• Licensed motorcycle technicians
            {"\n"}• Certified tuning professionals
            {"\n"}• Authorized service centers
            {"\n"}• Experienced mechanics with proper tools
            {"\n"}• Professionals with access to DYNO testing
            {"\n"}• Technicians familiar with your bike model
            {"\n"}• Shops with liability insurance
            {"\n"}• DYNO-equipped facilities for validation
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 YOUR RESPONSIBILITIES</Text>
          <Text style={styles.sectionContent}>
            By using this app, you agree to:
            {"\n"}• Consult qualified professionals before any modifications
            {"\n"}• Verify all legal requirements in your jurisdiction
            {"\n"}• Use appropriate safety equipment and procedures
            {"\n"}• Understand your motorcycle's technical specifications
            {"\n"}• Accept full responsibility for all modifications
            {"\n"}• Maintain proper insurance coverage
            {"\n"}• Follow all manufacturer safety guidelines
            {"\n"}• Report any safety issues to [Your Company Name]
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 LIABILITY DISCLAIMER</Text>
          <Text style={styles.sectionContent}>
            [Your Company Name] and its affiliates disclaim all liability for:
            {"\n"}• Personal injury or death
            {"\n"}• Property damage or loss
            {"\n"}• Environmental damage
            {"\n"}• Legal violations or penalties
            {"\n"}• Insurance claim denials
            {"\n"}• Vehicle devaluation
            {"\n"}• Performance degradation
            {"\n"}• [Your Company Name] provides recommendations only
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 SUPPORT & SAFETY CONTACTS</Text>
          <Text style={styles.sectionContent}>
            For safety questions or emergency support:
            {"\n"}• Safety Hotline: +1 (555) 123-XXXX
            {"\n"}• Email: safety@yourcompany.com
            {"\n"}• Emergency: Contact local emergency services
            {"\n"}• Technical Support: support@yourcompany.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 ACKNOWLEDGMENT REQUIRED</Text>
          <Text style={styles.sectionContent}>
            Please acknowledge each section below to proceed:
          </Text>
        </View>
      </ScrollView>

      {/* Acceptance Checkboxes */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("risks")}
        >
          <View
            style={[
              styles.checkboxBox,
              acceptedRisks && styles.checkboxChecked,
            ]}
          >
            {acceptedRisks && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I understand the performance and safety risks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("legal")}
        >
          <View
            style={[
              styles.checkboxBox,
              acceptedLegal && styles.checkboxChecked,
            ]}
          >
            {acceptedLegal && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I will ensure legal compliance in my jurisdiction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("compliance")}
        >
          <View
            style={[
              styles.checkboxBox,
              acceptedCompliance && styles.checkboxChecked,
            ]}
          >
            {acceptedCompliance && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I understand AI limitations and technical requirements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("professional")}
        >
          <View
            style={[
              styles.checkboxBox,
              acceptedProfessional && styles.checkboxChecked,
            ]}
          >
            {acceptedProfessional && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I will only use qualified professionals for modifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Support Link */}
      <TouchableOpacity style={styles.supportLink} onPress={handleContactSupport}>
        <SimpleIcon name="help-circle" size={20} color={Theme.colors.accent.primary} />
        <Text style={styles.supportText}>Need help? Contact Safety Support</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            !canProceed() && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={!canProceed()}
        >
          <SimpleIcon name="arrow-right" size={20} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>
            I Accept All Terms & Responsibilities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
          <SimpleIcon name="arrow-down" size={16} color="#FF6B6B" />
          <Text style={styles.declineButtonText}>Decline</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginTop: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginTop: 4,
    textAlign: "center",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  warningBox: {
    backgroundColor: "#ffe6e6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Theme.colors.semantic.error,
  },
  warningText: {
    fontSize: 14,
    color: Theme.colors.semantic.error,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginVertical: 16,
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.accent.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 20,
  },
  documentInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  documentInfoText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
  },
  acknowledgmentContainer: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.content.border,
  },
  acknowledgmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 8,
  },
  acknowledgmentSubtitle: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: Theme.colors.content.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: Theme.colors.content.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.accent.primary,
    borderColor: Theme.colors.accent.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
    borderRadius: 8,
    paddingVertical: 14,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.accent.primary,
    marginLeft: 8,
  },
  continueButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  continueButtonDisabled: {
    backgroundColor: Theme.colors.content.primarySecondary,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.content.primary,
  },
  continueButtonTextDisabled: {
    color: Theme.colors.content.primarySecondary,
  },
  scrollIndicator: {
    alignItems: "center",
    paddingVertical: 20,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  acceptButtonDisabled: {
    backgroundColor: Theme.colors.content.primarySecondary,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.content.primary,
    marginLeft: 8,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
    borderRadius: 8,
    paddingVertical: 14,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.accent.primary,
    marginLeft: 8,
  },
  supportLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  supportText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.accent.primary,
    marginLeft: 8,
  },
});

export default SafetyDisclaimerScreen;
