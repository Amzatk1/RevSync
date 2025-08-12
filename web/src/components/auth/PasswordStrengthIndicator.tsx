/**
 * Password Strength Indicator Component
 * 
 * Displays real-time password strength feedback with visual indicators.
 * Matches mobile implementation design and functionality.
 */

import React from 'react';
import { PasswordStrengthResult } from '../../types/auth';
import { getSecurityColor } from '../../utils/authUtils';

interface PasswordStrengthIndicatorProps {
  password: string;
  result: PasswordStrengthResult;
  showRequirements?: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  result,
  showRequirements = true,
  className = '',
}) => {
  if (!password) {
    return null;
  }

  const strengthColor = getSecurityColor(result.strength);
  const strengthPercentage = (result.score / 5) * 100;

  const strengthLabels = {
    'very-weak': 'Very Weak',
    'weak': 'Weak',
    'fair': 'Fair',
    'good': 'Good',
    'strong': 'Strong',
  };

  return (
    <div className={`password-strength-indicator ${className}`}>
      {/* Strength Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            Password Strength
          </span>
          <span 
            className="text-sm font-medium"
            style={{ color: strengthColor }}
          >
            {strengthLabels[result.strength]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{
              width: `${strengthPercentage}%`,
              backgroundColor: strengthColor,
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600 mb-2">Password must contain:</div>
          
          <div className="grid grid-cols-1 gap-1">
            <RequirementItem
              met={result.requirements.minLength}
              text="At least 8 characters"
            />
            <RequirementItem
              met={result.requirements.hasUppercase}
              text="One uppercase letter"
            />
            <RequirementItem
              met={result.requirements.hasLowercase}
              text="One lowercase letter"
            />
            <RequirementItem
              met={result.requirements.hasNumbers}
              text="One number"
            />
            <RequirementItem
              met={result.requirements.hasSpecialChars}
              text="One special character"
            />
            <RequirementItem
              met={result.requirements.noCommonPatterns}
              text="No common patterns"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {result.feedback.length > 0 && (
        <div className="mt-2 space-y-1">
          {result.feedback.map((feedback, index) => (
            <div
              key={index}
              className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded"
            >
              {feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        met ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {met ? (
          <svg
            className="w-3 h-3 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-400" />
        )}
      </div>
      <span className={`text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
};

export default PasswordStrengthIndicator;
