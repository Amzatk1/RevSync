/**
 * Password Strength Indicator Component
 * 
 * Visual component that shows password strength in real-time as the user types.
 * Provides color-coded strength levels and helpful feedback.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { validatePassword, getSecurityColor } from '../utils/authUtils';
import { PasswordStrengthResult } from '../types/auth';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = false,
}) => {
  const strength = validatePassword(password);

  const getStrengthColor = (strengthLevel: string): string => {
    return getSecurityColor(strengthLevel);
  };

  const getStrengthText = (strengthLevel: string): string => {
    switch (strengthLevel) {
      case 'very-weak':
        return 'Very Weak';
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      default:
        return 'Unknown';
    }
  };

  const renderStrengthBars = () => {
    const bars = 4;
    const filledBars = Math.min(strength.score, bars);
    
    return (
      <View style={styles.strengthBarsContainer}>
        {Array.from({ length: bars }, (_, index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              {
                backgroundColor: index < filledBars 
                  ? getStrengthColor(strength.strength)
                  : '#E5E7EB',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderRequirements = () => {
    if (!showRequirements) return null;

    const requirements = [
      { key: 'minLength', text: 'At least 8 characters' },
      { key: 'hasUppercase', text: 'One uppercase letter' },
      { key: 'hasLowercase', text: 'One lowercase letter' },
      { key: 'hasNumbers', text: 'One number' },
      { key: 'hasSpecialChars', text: 'One special character' },
      { key: 'noCommonPatterns', text: 'No common patterns' },
    ];

    return (
      <View style={styles.requirementsContainer}>
        {requirements.map((req) => (
          <View key={req.key} style={styles.requirementRow}>
            <View
              style={[
                styles.requirementIndicator,
                {
                  backgroundColor: strength.requirements[req.key as keyof typeof strength.requirements]
                    ? '#16A34A'
                    : '#E5E7EB',
                },
              ]}
            />
            <Text
              style={[
                styles.requirementText,
                {
                  color: strength.requirements[req.key as keyof typeof strength.requirements]
                    ? '#16A34A'
                    : '#6B7280',
                },
              ]}
            >
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Password strength:</Text>
        <Text
          style={[
            styles.strengthText,
            { color: getStrengthColor(strength.strength) },
          ]}
        >
          {getStrengthText(strength.strength)}
        </Text>
      </View>
      
      {renderStrengthBars()}
      
      {strength.feedback.length > 0 && (
        <Text style={styles.feedbackText}>
          {strength.feedback[0]}
        </Text>
      )}
      
      {renderRequirements()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthBarsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  feedbackText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  requirementsContainer: {
    gap: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  requirementText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default PasswordStrengthIndicator; 