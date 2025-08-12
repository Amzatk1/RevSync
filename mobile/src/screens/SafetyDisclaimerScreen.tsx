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
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedCompliance, setAcceptedCompliance] = useState(false);
  const [acceptedProfessional, setAcceptedProfessional] = useState(false);

  const mandatory = route?.params?.mandatory ?? true;
  const returnTo = route?.params?.returnTo;

  const handleScroll = async (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      if (!hasScrolledToBottom) {
        setHasScrolledToBottom(true);
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    }
  };

  const handleAcceptanceChange = async (type: string) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    let nextRisks = acceptedRisks;
    let nextLegal = acceptedLegal;
    let nextCompliance = acceptedCompliance;
    let nextProfessional = acceptedProfessional;

    switch (type) {
      case "risks":
        nextRisks = !acceptedRisks; setAcceptedRisks(nextRisks); break;
      case "legal":
        nextLegal = !acceptedLegal; setAcceptedLegal(nextLegal); break;
      case "compliance":
        nextCompliance = !acceptedCompliance; setAcceptedCompliance(nextCompliance); break;
      case "professional":
        nextProfessional = !acceptedProfessional; setAcceptedProfessional(nextProfessional); break;
    }

    const payload = {
      acceptedRisks: nextRisks,
      acceptedLegal: nextLegal,
      acceptedCompliance: nextCompliance,
      acceptedProfessional: nextProfessional,
      hasScrolledToBottom,
      accepted_version: "2025.2",
    };

    try {
      await AsyncStorage.setItem("safety_disclaimer_progress", JSON.stringify(payload));
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
      await AsyncStorage.multiSet([
        ["safety_disclaimer_accepted", "true"],
        ["safety_disclaimer_date", new Date().toISOString()],
        ["safety_disclaimer_version", "2025.2"],
      ]);

      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

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
          <Text style={styles.headerTitle} allowFontScaling>Safety First</Text>
          <Text style={styles.headerSubtitle} allowFontScaling>
            Motorcycle Tuning Safety Disclaimer
          </Text>
        </View>
      </View>

      {/* Disclaimer Content */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        accessible
        accessibilityLabel="Safety disclaimer content. Scroll to the end to enable Accept."
      >
        <View style={styles.warningBox}>
          <SimpleIcon name="alert" size={24} color="#FF3B30" />
          <Text style={styles.warningText} allowFontScaling>
            CRITICAL SAFETY WARNING: Motorcycle ECU tuning carries significant risk. Read this entire notice. Tuning can affect safety, reliability, emissions compliance and insurance. Proceed only if you fully understand the risks.
          </Text>
        </View>

        {/* Risk Acknowledgment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>⚠️ PERFORMANCE RISKS</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            Engine and vehicle systems may be damaged or fail, including:
            {"\n"}• Engine/ECU damage or failure
            {"\n"}• Drivetrain and transmission stress
            {"\n"}• Braking and suspension overload
            {"\n"}• Tyre wear, degradation or blowouts
            {"\n"}• Loss of control or traction
            {"\n"}• Fire risk and heat‑related damage
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>🏛️ LEGAL COMPLIANCE</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            You are responsible for legal compliance where you ride. Examples include:
            {"\n"}• UK: DVSA/MOT rules and Road Vehicles (Construction & Use) regs; road‑use legality and noise limits
            {"\n"}• EU/EEA: Type‑approval and Euro 4/5 emissions and sound requirements
            {"\n"}• US: EPA federal rules; state laws including California CARB (EO exemptions) and DOT safety standards
            {"\n"}• Other regions: local registration, insurance and roadworthiness rules
            {"\n"}• Track/Off‑road only items must not be used on public roads
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>🏁 TRACK / OFF‑ROAD ONLY</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            Some tunes and parts are designated “track / off‑road only.” Where required by law, these must not be used on public roads. Always follow local rules and signage.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>🔧 TECHNICAL LIMITATIONS</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            Our AI recommendations are advisory:
            {"\n"}• May not account for wear, damage or prior modifications
            {"\n"}• Cannot predict individual riding style or conditions
            {"\n"}• Based on available datasets and community inputs
            {"\n"}• May not reflect the latest recalls or service bulletins
            {"\n"}• Compatibility is not guaranteed across aftermarket parts or fuels
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>👨‍🔧 PROFESSIONAL REQUIREMENTS</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            ECU modifications should be performed by qualified professionals:
            {"\n"}• Licensed motorcycle technicians or certified tuners
            {"\n"}• Authorized service centres with appropriate tools
            {"\n"}• DYNO‑equipped facilities for validation where applicable
            {"\n"}• Technicians experienced with your specific model
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>📋 YOUR RESPONSIBILITIES</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            By using RevSync, you agree to:
            {"\n"}• Consult qualified professionals before modifications
            {"\n"}• Verify road‑use legality and emissions/noise rules in your region
            {"\n"}• Use proper safety equipment and procedures
            {"\n"}• Understand your motorcycle’s specifications and limits
            {"\n"}• Accept full responsibility for all modifications and their consequences
            {"\n"}• Maintain appropriate insurance coverage
            {"\n"}• Follow manufacturer and regulatory safety guidance
            {"\n"}• Report safety concerns to safety@revsync.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>🚫 LIABILITY DISCLAIMER</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            RevSync Ltd and its affiliates disclaim liability for:
            {"\n"}• Personal injury or death
            {"\n"}• Property or environmental damage
            {"\n"}• Legal violations, penalties or insurance denials
            {"\n"}• Vehicle devaluation or performance degradation
            {"\n"}RevSync provides advisory recommendations only and does not guarantee safety or compliance.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>📞 SUPPORT & SAFETY CONTACTS</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            For safety questions or urgent support:
            {"\n"}• Safety Hotline (UK): +44 20 1234 0000
            {"\n"}• Email: safety@revsync.com
            {"\n"}• Technical Support: support@revsync.com
            {"\n"}• Emergency: contact local emergency services
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling>📝 ACKNOWLEDGMENT REQUIRED</Text>
          <Text style={styles.sectionContent} allowFontScaling>
            Please acknowledge each section below to proceed:
          </Text>
        </View>

        {!hasScrolledToBottom && (
          <View style={styles.scrollIndicator} accessible accessibilityLiveRegion="polite">
            <SimpleIcon name="arrow-down" size={18} color={Theme.colors.content.primarySecondary} />
            <Text style={styles.scrollIndicatorText} allowFontScaling>
              Scroll to the end to enable Accept
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Acceptance Checkboxes */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("risks")}
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedRisks }}
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
          <Text style={styles.checkboxText} allowFontScaling>
            I understand the performance and safety risks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("legal")}
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedLegal }}
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
          <Text style={styles.checkboxText} allowFontScaling>
            I will ensure legal compliance in my jurisdiction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("compliance")}
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedCompliance }}
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
          <Text style={styles.checkboxText} allowFontScaling>
            I understand AI limitations and technical requirements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleAcceptanceChange("professional")}
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedProfessional }}
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
          <Text style={styles.checkboxText} allowFontScaling>
            I will only use qualified professionals for modifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Support Link */}
      <TouchableOpacity style={styles.supportLink} onPress={handleContactSupport}>
        <SimpleIcon name="help-circle" size={20} color={Theme.colors.accent.primary} />
        <Text style={styles.supportText} allowFontScaling>Need help? Contact Safety Support</Text>
      </TouchableOpacity>
      <View style={{ alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: Theme.colors.content.primarySecondary }} allowFontScaling>
          By continuing you agree to our Terms, Privacy Policy and EULA.
        </Text>
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentInfoText} allowFontScaling>
          Last updated: August 8, 2025 • Doc v2025.2
        </Text>
      </View>
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            !canProceed() && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={!canProceed()}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Accept all terms and responsibilities"
        >
          <SimpleIcon name="arrow-right" size={20} color="#FFFFFF" />
          <Text style={styles.acceptButtonText} allowFontScaling>
            I Accept All Terms & Responsibilities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Decline safety disclaimer"
        >
          <SimpleIcon name="arrow-down" size={16} color="#FF6B6B" />
          <Text style={styles.declineButtonText} allowFontScaling>Decline</Text>
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
