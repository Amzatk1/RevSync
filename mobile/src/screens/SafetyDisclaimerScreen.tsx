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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import { AwardWinningTheme as Theme } from "../styles/awardWinningTheme";

interface SafetyDisclaimerScreenProps {
  route?: {
    params?: {
      mandatory?: boolean;
      returnTo?: string;
    };
  };
}

const SafetyDisclaimerScreen: React.FC<SafetyDisclaimerScreenProps> = ({
  route,
}) => {
  const navigation = useNavigation();
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const mandatory = route?.params?.mandatory ?? true;
  const returnTo = route?.params?.returnTo;

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      setHasScrolledToBottom(true);
      setHasReadDisclaimer(true);
    }
  };

  const handleContinue = async () => {
    if (!acceptedTerms || !acceptedRisks || !acceptedLegal) {
      Alert.alert(
        "Incomplete Acceptance",
        "You must accept all terms and acknowledgments to continue using RevSync for ECU modifications.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Store consent in AsyncStorage
      const consentData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        acceptedTerms,
        acceptedRisks,
        acceptedLegal,
        userAgent: "RevSync Mobile App",
      };

      await AsyncStorage.setItem(
        "safety_disclaimer_consent",
        JSON.stringify(consentData)
      );

      if (returnTo) {
        navigation.navigate(returnTo as never);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save consent. Please try again.");
    }
  };

  const handleDecline = () => {
    Alert.alert(
      "Safety Agreement Required",
      "You must accept the safety agreement to use ECU modification features. You can still browse community content and resources.",
      [
        {
          text: "Browse Only",
          onPress: () => {
            if (returnTo) {
              navigation.navigate("Marketplace" as never);
            } else {
              navigation.goBack();
            }
          },
        },
        { text: "Review Again", style: "cancel" },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL("https://revsync.app/privacy");
  };

  const openTermsOfService = () => {
    Linking.openURL("https://revsync.app/terms");
  };

  const canContinue =
    hasReadDisclaimer && acceptedTerms && acceptedRisks && acceptedLegal;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.semantic.error, "#cc0000"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Icon name="shield-alert" size={32} color={#FFFFFF} />
          <Text style={styles.headerTitle}>⚠️ SAFETY AGREEMENT ⚠️</Text>
          <Text style={styles.headerSubtitle}>
            REQUIRED FOR ECU MODIFICATIONS
          </Text>
        </View>
      </LinearGradient>

      {/* Disclaimer Content */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.warningBox}>
          <Icon
            name="alert-octagon"
            size={48}
            color={Theme.colors.semantic.error}
          />
          <Text style={styles.warningTitle}>CRITICAL SAFETY WARNING</Text>
          <Text style={styles.warningText}>
            ECU modifications can be extremely dangerous and may result in:
          </Text>
        </View>

        {/* Risk Categories */}
        <View style={styles.riskSection}>
          <Text style={styles.sectionTitle}>🚨 SERIOUS RISKS</Text>

          <View style={styles.riskItem}>
            <Icon name="skull" size={24} color={Theme.colors.semantic.error} />
            <View style={styles.riskContent}>
              <Text style={styles.riskTitle}>Risk of Injury or Death</Text>
              <Text style={styles.riskDescription}>
                • Loss of vehicle control leading to accidents{"\n"}• Engine
                failure resulting in sudden loss of power{"\n"}• Fire or
                explosion due to unsafe fuel/air mixtures{"\n"}• Mechanical
                failures that may cause serious injury
              </Text>
            </View>
          </View>

          <View style={styles.riskItem}>
            <Icon
              name="engine"
              size={24}
              color={Theme.colors.semantic.warning}
            />
            <View style={styles.riskContent}>
              <Text style={styles.riskTitle}>Engine and Vehicle Damage</Text>
              <Text style={styles.riskDescription}>
                • Permanent engine damage or destruction{"\n"}• ECU corruption
                requiring expensive replacement{"\n"}• Damage to fuel, ignition,
                or exhaust systems{"\n"}• Complete loss of motorcycle
                functionality
              </Text>
            </View>
          </View>

          <View style={styles.riskItem}>
            <Icon name="gavel" size={24} color={Theme.colors.info} />
            <View style={styles.riskContent}>
              <Text style={styles.riskTitle}>
                Legal and Financial Consequences
              </Text>
              <Text style={styles.riskDescription}>
                • Voiding of manufacturer warranties{"\n"}• Violation of
                emissions regulations{"\n"}• Loss of insurance coverage{"\n"}•
                Legal liability for accidents or damages
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Requirements */}
        <View style={styles.requirementSection}>
          <Text style={styles.sectionTitle}>
            👨‍🔧 PROFESSIONAL INSTALLATION REQUIRED
          </Text>
          <Text style={styles.requirementText}>
            ECU modifications should ONLY be performed by qualified
            professionals with:
          </Text>
          <View style={styles.requirementList}>
            <Text style={styles.requirementItem}>
              • Proper diagnostic equipment and tools
            </Text>
            <Text style={styles.requirementItem}>
              • Experience with your specific motorcycle model
            </Text>
            <Text style={styles.requirementItem}>
              • Knowledge of safety protocols and procedures
            </Text>
            <Text style={styles.requirementItem}>
              • Ability to restore original calibration if needed
            </Text>
            <Text style={styles.requirementItem}>
              • Understanding of legal and warranty implications
            </Text>
          </View>
        </View>

        {/* Legal Disclaimers */}
        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>⚖️ LEGAL DISCLAIMERS</Text>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>ASSUMPTION OF RISK</Text>
            <Text style={styles.disclaimerText}>
              By using RevSync for ECU modifications, you expressly acknowledge
              and agree that you assume ALL RISKS associated with motorcycle ECU
              modifications, including but not limited to risks of personal
              injury, death, property damage, and legal liability.
            </Text>
          </View>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>LIMITATION OF LIABILITY</Text>
            <Text style={styles.disclaimerText}>
              RevSync, its developers, and contributors SHALL NOT BE LIABLE for
              any damages, injuries, losses, or legal consequences resulting
              from the use of ECU modifications obtained through this platform.
            </Text>
          </View>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>NO WARRANTIES</Text>
            <Text style={styles.disclaimerText}>
              All content is provided "AS IS" without warranties of any kind. We
              do not warrant the safety, compatibility, or performance of any
              ECU modifications.
            </Text>
          </View>
        </View>

        {/* Age and Competency Requirements */}
        <View style={styles.ageSection}>
          <Text style={styles.sectionTitle}>
            🔞 AGE AND COMPETENCY REQUIREMENTS
          </Text>
          <Text style={styles.ageText}>
            By proceeding, you confirm that you:
          </Text>
          <View style={styles.ageList}>
            <Text style={styles.ageItem}>• Are at least 18 years of age</Text>
            <Text style={styles.ageItem}>
              • Have legal authority to modify your motorcycle
            </Text>
            <Text style={styles.ageItem}>
              • Possess adequate technical knowledge for safe modifications
            </Text>
            <Text style={styles.ageItem}>
              • Will seek professional assistance when appropriate
            </Text>
            <Text style={styles.ageItem}>
              • Understand and accept all risks and consequences
            </Text>
          </View>
        </View>

        {/* Read Indicator */}
        {!hasScrolledToBottom && (
          <View style={styles.scrollIndicator}>
            <Icon
              name="arrow-down"
              size={24}
              color={Theme.colors.content.primarySecondary}
            />
            <Text style={styles.scrollText}>
              Scroll to read complete disclaimer
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Consent Checkboxes */}
      <View style={styles.consentSection}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
          disabled={!hasReadDisclaimer}
        >
          <View
            style={[
              styles.checkbox,
              acceptedTerms && styles.checkboxChecked,
              !hasReadDisclaimer && styles.checkboxDisabled,
            ]}
          >
            {acceptedTerms && <Icon name="check" size={16} color={#FFFFFF} />}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text
              style={[
                styles.checkboxText,
                !hasReadDisclaimer && styles.disabledText,
              ]}
            >
              I have read and agree to the{" "}
              <Text style={styles.linkText} onPress={openTermsOfService}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcceptedRisks(!acceptedRisks)}
          disabled={!hasReadDisclaimer}
        >
          <View
            style={[
              styles.checkbox,
              acceptedRisks && styles.checkboxChecked,
              !hasReadDisclaimer && styles.checkboxDisabled,
            ]}
          >
            {acceptedRisks && <Icon name="check" size={16} color={#FFFFFF} />}
          </View>
          <Text
            style={[
              styles.checkboxText,
              !hasReadDisclaimer && styles.disabledText,
            ]}
          >
            I understand and accept ALL RISKS associated with ECU modifications,
            including risks of injury, death, and property damage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcceptedLegal(!acceptedLegal)}
          disabled={!hasReadDisclaimer}
        >
          <View
            style={[
              styles.checkbox,
              acceptedLegal && styles.checkboxChecked,
              !hasReadDisclaimer && styles.checkboxDisabled,
            ]}
          >
            {acceptedLegal && <Icon name="check" size={16} color={#FFFFFF} />}
          </View>
          <Text
            style={[
              styles.checkboxText,
              !hasReadDisclaimer && styles.disabledText,
            ]}
          >
            I agree to hold RevSync harmless and release all liability for any
            consequences of ECU modifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.acceptButton,
            !canContinue && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text
            style={[
              styles.acceptButtonText,
              !canContinue && styles.buttonTextDisabled,
            ]}
          >
            Accept & Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Warning */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ By accepting, you acknowledge the serious risks of ECU
          modifications
        </Text>
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
    color: #FFFFFF,
    marginTop: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: #FFFFFF,
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
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: Theme.colors.semantic.error,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.semantic.error,
    marginTop: 12,
    textAlign: "center",
  },
  warningText: {
    fontSize: 14,
    color: Theme.colors.semantic.error,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  riskSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 12,
  },
  riskItem: {
    flexDirection: "row",
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.semantic.error,
  },
  riskContent: {
    flex: 1,
    marginLeft: 12,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 4,
  },
  riskDescription: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 18,
  },
  requirementSection: {
    marginVertical: 16,
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.semantic.warning,
  },
  requirementText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  requirementList: {
    marginTop: 8,
  },
  requirementItem: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  legalSection: {
    marginVertical: 16,
  },
  disclaimerBox: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 18,
  },
  ageSection: {
    marginVertical: 16,
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  ageText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  ageList: {
    marginTop: 8,
  },
  ageItem: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  scrollIndicator: {
    alignItems: "center",
    paddingVertical: 20,
  },
  scrollText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    marginTop: 8,
  },
  consentSection: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.accent.primary,
    borderColor: Theme.colors.accent.primary,
  },
  checkboxDisabled: {
    backgroundColor: Theme.colors.border,
    borderColor: Theme.colors.border,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 12,
    color: Theme.colors.content.primary,
    lineHeight: 18,
  },
  disabledText: {
    color: Theme.colors.content.primarySecondary,
  },
  linkText: {
    color: Theme.colors.accent.primary,
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  acceptButton: {
    backgroundColor: Theme.colors.accent.primary,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.border,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.content.primary,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: #FFFFFF,
  },
  buttonTextDisabled: {
    color: Theme.colors.content.primarySecondary,
  },
  footer: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  footerText: {
    fontSize: 10,
    color: Theme.colors.content.primarySecondary,
    textAlign: "center",
  },
});

export default SafetyDisclaimerScreen;
