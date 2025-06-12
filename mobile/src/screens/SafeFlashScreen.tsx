import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import { Theme } from '../styles/theme';
import { flashTune, checkSafetyConsents, grantConsent } from '../store/slices/flashSlice';
import { RootState } from '../store';
import { FlashSession, ConsentType, ValidationResult } from '../types/flash';

const { width, height } = Dimensions.get('window');

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

const FLASH_STAGES = [
  {
    id: 'PREPARING',
    title: 'Preparing Flash',
    description: 'Initializing flash process and safety checks',
    icon: 'cog-outline',
    color: Theme.colors.primary,
  },
  {
    id: 'BACKING_UP',
    title: 'Creating Backup',
    description: 'Backing up original ECU data for safety',
    icon: 'backup-restore',
    color: Theme.colors.warning,
  },
  {
    id: 'VALIDATING',
    title: 'Validating Tune',
    description: 'Running comprehensive safety validation',
    icon: 'shield-check',
    color: Theme.colors.info,
  },
  {
    id: 'PRE_CHECKS',
    title: 'Safety Checks',
    description: 'Verifying all safety requirements',
    icon: 'clipboard-check',
    color: Theme.colors.warning,
  },
  {
    id: 'FLASHING',
    title: 'Flashing ECU',
    description: 'Writing tune to ECU - DO NOT DISCONNECT',
    icon: 'flash',
    color: Theme.colors.danger,
  },
  {
    id: 'VERIFYING',
    title: 'Verifying Flash',
    description: 'Confirming successful flash completion',
    icon: 'check-circle',
    color: Theme.colors.success,
  },
];

export const SafeFlashScreen: React.FC<SafeFlashScreenProps> = ({ route, navigation }) => {
  const { tuneId, motorcycleId, purchaseId } = route.params;
  const dispatch = useDispatch();
  
  const { 
    currentSession,
    isFlashing,
    progress,
    currentStage,
    validationResult,
    requiredConsents,
    grantedConsents,
    error 
  } = useSelector((state: RootState) => state.flash);

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<ConsentType | null>(null);
  const [bikeInSafeMode, setBikeInSafeMode] = useState(false);
  const [userConfirmedSafety, setUserConfirmedSafety] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check required consents when screen loads
    dispatch(checkSafetyConsents({ tuneId, motorcycleId }));
  }, [dispatch, tuneId, motorcycleId]);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimation]);

  useEffect(() => {
    // Pulse animation for critical stages
    if (currentStage === 'FLASHING') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (currentStage === 'FLASHING') {
            pulse();
          }
        });
      };
      pulse();
    }
  }, [currentStage, pulseAnimation]);

  const handleConsentRequired = useCallback((consentType: ConsentType) => {
    setCurrentConsent(consentType);
    setShowConsentModal(true);
  }, []);

  const handleGrantConsent = useCallback(async () => {
    if (!currentConsent) return;
    
    try {
      await dispatch(grantConsent({
        consentType: currentConsent,
        tuneId,
        motorcycleId,
      })).unwrap();
      
      setShowConsentModal(false);
      setCurrentConsent(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to grant consent. Please try again.');
    }
  }, [dispatch, currentConsent, tuneId, motorcycleId]);

  const handleStartFlash = useCallback(async () => {
    if (!bikeInSafeMode || !userConfirmedSafety) {
      Alert.alert(
        'Safety Check Failed',
        'Please ensure your motorcycle is turned off, in neutral, and all safety requirements are met.'
      );
      return;
    }

    // Final safety confirmation
    Alert.alert(
      '⚠️ FINAL SAFETY CONFIRMATION',
      'You are about to modify your motorcycle\'s ECU. This process:\n\n• Cannot be interrupted once started\n• May void your warranty\n• Requires you to keep the bike stationary\n• Is done at your own risk\n\nAre you absolutely certain you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PROCEED',
          style: 'destructive',
          onPress: () => {
            dispatch(flashTune({
              tuneId,
              motorcycleId,
              purchaseId,
              bikeInSafeMode,
              userConfirmedSafety,
            }));
          },
        },
      ]
    );
  }, [dispatch, tuneId, motorcycleId, purchaseId, bikeInSafeMode, userConfirmedSafety]);

  const handleEmergencyStop = useCallback(() => {
    Alert.alert(
      '🚨 EMERGENCY STOP',
      'This will attempt to stop the flash process and restore your original ECU data. Only use this if there is a serious problem.\n\nProceed with emergency stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'EMERGENCY STOP',
          style: 'destructive',
          onPress: () => {
            // Implement emergency stop logic
            setShowEmergencyModal(true);
          },
        },
      ]
    );
  }, []);

  const renderProgressIndicator = () => {
    const currentStageIndex = FLASH_STAGES.findIndex(stage => stage.id === currentStage);
    
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Flash Progress</Text>
        <ProgressBar
          progress={progress / 100}
          color={Theme.colors.primary}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>{progress}%</Text>
        
        <View style={styles.stagesContainer}>
          {FLASH_STAGES.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isCritical = stage.id === 'FLASHING';
            
            return (
              <Animated.View
                key={stage.id}
                style={[
                  styles.stageItem,
                  isActive && styles.stageActive,
                  isCompleted && styles.stageCompleted,
                  isCritical && isActive && { transform: [{ scale: pulseAnimation }] },
                ]}
              >
                <View
                  style={[
                    styles.stageIcon,
                    { backgroundColor: isActive ? stage.color : Theme.colors.border },
                  ]}
                >
                  <Icon
                    name={isCompleted ? 'check' : stage.icon}
                    size={20}
                    color={isActive || isCompleted ? Theme.colors.white : Theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.stageContent}>
                  <Text style={[
                    styles.stageTitle,
                    isActive && styles.stageTitleActive,
                  ]}>
                    {stage.title}
                  </Text>
                  <Text style={styles.stageDescription}>
                    {stage.description}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSafetyChecklist = () => {
    const missingConsents = requiredConsents.filter(
      consent => !grantedConsents.includes(consent)
    );

    return (
      <View style={styles.safetyContainer}>
        <Text style={styles.safetyTitle}>🛡️ Safety Requirements</Text>
        
        {/* Consent Requirements */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistHeader}>Legal Consents</Text>
          {requiredConsents.map(consent => {
            const isGranted = grantedConsents.includes(consent);
            return (
              <TouchableOpacity
                key={consent}
                style={[
                  styles.checklistItem,
                  isGranted && styles.checklistItemCompleted,
                ]}
                onPress={() => !isGranted && handleConsentRequired(consent)}
                disabled={isGranted}
              >
                <Icon
                  name={isGranted ? 'check-circle' : 'circle-outline'}
                  size={24}
                  color={isGranted ? Theme.colors.success : Theme.colors.textSecondary}
                />
                <Text style={[
                  styles.checklistText,
                  isGranted && styles.checklistTextCompleted,
                ]}>
                  {consent.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                {!isGranted && (
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={Theme.colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Physical Safety Requirements */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistHeader}>Physical Safety</Text>
          
          <TouchableOpacity
            style={[
              styles.checklistItem,
              bikeInSafeMode && styles.checklistItemCompleted,
            ]}
            onPress={() => setBikeInSafeMode(!bikeInSafeMode)}
          >
            <Icon
              name={bikeInSafeMode ? 'check-circle' : 'circle-outline'}
              size={24}
              color={bikeInSafeMode ? Theme.colors.success : Theme.colors.textSecondary}
            />
            <Text style={[
              styles.checklistText,
              bikeInSafeMode && styles.checklistTextCompleted,
            ]}>
              Motorcycle is OFF and in NEUTRAL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.checklistItem,
              userConfirmedSafety && styles.checklistItemCompleted,
            ]}
            onPress={() => setUserConfirmedSafety(!userConfirmedSafety)}
          >
            <Icon
              name={userConfirmedSafety ? 'check-circle' : 'circle-outline'}
              size={24}
              color={userConfirmedSafety ? Theme.colors.success : Theme.colors.textSecondary}
            />
            <Text style={[
              styles.checklistText,
              userConfirmedSafety && styles.checklistTextCompleted,
            ]}>
              I understand the risks and responsibilities
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderValidationResults = () => {
    if (!validationResult) return null;

    return (
      <View style={styles.validationContainer}>
        <Text style={styles.validationTitle}>🔍 Tune Validation Results</Text>
        
        <View style={[
          styles.riskBadge,
          { backgroundColor: getRiskColor(validationResult.riskLevel) },
        ]}>
          <Text style={styles.riskText}>
            Risk Level: {validationResult.riskLevel}
          </Text>
        </View>

        {validationResult.violations.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesHeader}>⚠️ Safety Violations</Text>
            {validationResult.violations.map((violation, index) => (
              <Text key={index} style={styles.violationText}>
                • {violation}
              </Text>
            ))}
          </View>
        )}

        {validationResult.warnings.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesHeader}>⚡ Warnings</Text>
            {validationResult.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'MINIMAL': return Theme.colors.success;
      case 'LOW': return Theme.colors.info;
      case 'MEDIUM': return Theme.colors.warning;
      case 'HIGH': return Theme.colors.danger;
      case 'CRITICAL': return '#8B0000';
      default: return Theme.colors.textSecondary;
    }
  };

  const canStartFlash = () => {
    const hasAllConsents = requiredConsents.every(consent => 
      grantedConsents.includes(consent)
    );
    return hasAllConsents && bikeInSafeMode && userConfirmedSafety && !isFlashing;
  };

  const isFlashInProgress = isFlashing && currentStage !== 'COMPLETED' && currentStage !== 'FAILED';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isFlashInProgress}
          >
            <Icon name="arrow-left" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safe ECU Flash</Text>
          {isFlashInProgress && (
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={handleEmergencyStop}
            >
              <Icon name="stop-circle" size={24} color={Theme.colors.danger} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Progress Indicator */}
        {isFlashing && renderProgressIndicator()}

        {/* Safety Checklist */}
        {!isFlashing && renderSafetyChecklist()}

        {/* Validation Results */}
        {renderValidationResults()}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color={Theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Critical Warnings */}
        {isFlashInProgress && currentStage === 'FLASHING' && (
          <View style={styles.criticalWarning}>
            <Icon name="alert" size={32} color={Theme.colors.danger} />
            <Text style={styles.criticalWarningTitle}>⚠️ CRITICAL PHASE</Text>
            <Text style={styles.criticalWarningText}>
              DO NOT disconnect your device or turn off your motorcycle.
              This could cause permanent ECU damage.
            </Text>
            <ActivityIndicator size="large" color={Theme.colors.danger} />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!isFlashing ? (
          <TouchableOpacity
            style={[
              styles.flashButton,
              !canStartFlash() && styles.flashButtonDisabled,
            ]}
            onPress={handleStartFlash}
            disabled={!canStartFlash()}
          >
            <LinearGradient
              colors={canStartFlash() 
                ? [Theme.colors.primary, Theme.colors.primaryDark]
                : [Theme.colors.border, Theme.colors.border]
              }
              style={styles.flashButtonGradient}
            >
              <Icon 
                name="flash" 
                size={24} 
                color={canStartFlash() ? Theme.colors.white : Theme.colors.textSecondary} 
              />
              <Text style={[
                styles.flashButtonText,
                !canStartFlash() && styles.flashButtonTextDisabled,
              ]}>
                Start Flash Process
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.flashingStatus}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.flashingText}>
              {currentStage === 'COMPLETED' ? 'Flash Completed Successfully!' : 'Flashing in Progress...'}
            </Text>
            {currentStage === 'COMPLETED' && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.completeButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Consent Modal */}
      <ConsentModal
        visible={showConsentModal}
        consentType={currentConsent}
        onAccept={handleGrantConsent}
        onDecline={() => setShowConsentModal(false)}
      />

      {/* Emergency Stop Modal */}
      <Modal
        visible={showEmergencyModal}
        transparent
        animationType="fade"
      >
        <View style={styles.emergencyModalOverlay}>
          <View style={styles.emergencyModalContent}>
            <Icon name="alert-octagon" size={48} color={Theme.colors.danger} />
            <Text style={styles.emergencyModalTitle}>🚨 Emergency Stop Activated</Text>
            <Text style={styles.emergencyModalText}>
              Attempting to safely halt the flash process and restore backup...
            </Text>
            <ActivityIndicator size="large" color={Theme.colors.danger} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Consent Modal Component
const ConsentModal: React.FC<{
  visible: boolean;
  consentType: ConsentType | null;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ visible, consentType, onAccept, onDecline }) => {
  const getConsentContent = (type: ConsentType | null) => {
    if (!type) return { title: '', content: '' };
    
    const contentMap = {
      GENERAL_LIABILITY: {
        title: 'General Liability Waiver',
        content: 'By using RevSync to modify your motorcycle\'s ECU, you acknowledge that ECU modifications can significantly alter your motorcycle\'s performance and you assume all risks associated with these modifications.',
      },
      ECU_MODIFICATION: {
        title: 'ECU Modification Consent',
        content: 'I understand that modifying my motorcycle\'s ECU involves altering factory-programmed engine parameters and may void warranties or affect emissions compliance.',
      },
      WARRANTY_VOID: {
        title: 'Warranty Void Acknowledgment',
        content: 'I acknowledge that ECU modifications may void my motorcycle\'s manufacturer warranty and affect insurance coverage.',
      },
      TRACK_ONLY: {
        title: 'Track Only Use Agreement',
        content: 'This tune is designed for TRACK USE ONLY and may not be legal for street use. I confirm this modification will be used for track/competition purposes only.',
      },
      EXPERT_TUNE: {
        title: 'Expert Level Tune Warning',
        content: 'This is an EXPERT LEVEL tune that makes significant engine parameter changes and requires advanced knowledge to use safely.',
      },
      BACKUP_RESPONSIBILITY: {
        title: 'Backup Responsibility Agreement',
        content: 'I understand that creating an ECU backup before modification is MANDATORY and I am responsible for maintaining my backup files.',
      },
    };
    
    return contentMap[type] || { title: '', content: '' };
  };

  const { title, content } = getConsentContent(consentType);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalText}>{content}</Text>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptButtonText}>I Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.white,
    textAlign: 'center',
    marginRight: 40,
  },
  emergencyButton: {
    padding: 8,
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
  },
  progressContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.border,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stagesContainer: {
    marginTop: 20,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  stageActive: {
    backgroundColor: Theme.colors.primaryLight + '20',
  },
  stageCompleted: {
    backgroundColor: Theme.colors.success + '20',
  },
  stageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageContent: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  stageTitleActive: {
    color: Theme.colors.primary,
  },
  stageDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  safetyContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  checklistSection: {
    marginBottom: 20,
  },
  checklistHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    marginBottom: 8,
  },
  checklistItemCompleted: {
    backgroundColor: Theme.colors.success + '20',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
    marginLeft: 12,
  },
  checklistTextCompleted: {
    color: Theme.colors.success,
    textDecorationLine: 'line-through',
  },
  validationContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  validationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  issuesContainer: {
    marginBottom: 16,
  },
  issuesHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  violationText: {
    fontSize: 14,
    color: Theme.colors.danger,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 14,
    color: Theme.colors.warning,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: Theme.colors.danger + '20',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.danger,
    marginLeft: 12,
  },
  criticalWarning: {
    margin: 16,
    padding: 24,
    backgroundColor: Theme.colors.danger + '10',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.danger,
    alignItems: 'center',
  },
  criticalWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.danger,
    marginVertical: 8,
  },
  criticalWarningText: {
    fontSize: 14,
    color: Theme.colors.danger,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  flashButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  flashButtonDisabled: {
    opacity: 0.5,
  },
  flashButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  flashButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.white,
    marginLeft: 8,
  },
  flashButtonTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  flashingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  flashingText: {
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 12,
  },
  completeButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: height * 0.5,
  },
  modalText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  emergencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyModalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 20,
  },
  emergencyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.danger,
    marginVertical: 16,
    textAlign: 'center',
  },
  emergencyModalText: {
    fontSize: 14,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
}); 