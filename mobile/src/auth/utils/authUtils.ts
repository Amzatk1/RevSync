/**
 * Authentication Utilities for RevSync Mobile App
 * 
 * Utility functions for email validation, password strength checking,
 * device fingerprinting, and other authentication-related helpers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PasswordStrengthResult } from '../types/auth';

/**
 * Validate email address format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): PasswordStrengthResult => {
  const result: PasswordStrengthResult = {
    score: 0,
    strength: 'very-weak',
    feedback: [],
    isValid: false,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      noCommonPatterns: true,
    },
  };

  // Check minimum length
  if (password.length >= 8) {
    result.requirements.minLength = true;
    result.score += 1;
  } else {
    result.feedback.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.requirements.hasUppercase = true;
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.requirements.hasLowercase = true;
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.requirements.hasNumbers = true;
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one number');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.requirements.hasSpecialChars = true;
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    '123456',
    'password',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'admin',
  ];

  const passwordLower = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (passwordLower.includes(pattern)) {
      result.requirements.noCommonPatterns = false;
      result.feedback.push('Password contains common patterns');
      break;
    }
  }

  // Determine strength level
  if (result.score <= 1) {
    result.strength = 'very-weak';
  } else if (result.score === 2) {
    result.strength = 'weak';
  } else if (result.score === 3) {
    result.strength = 'fair';
  } else if (result.score === 4) {
    result.strength = 'good';
  } else {
    result.strength = 'strong';
  }

  // Overall validation
  result.isValid = Object.values(result.requirements).every(Boolean);

  return result;
};

/**
 * Format phone number for international use
 */
export const formatPhoneNumber = (phone: string, countryCode: string = '+1'): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!digits.startsWith('1') && countryCode === '+1') {
    return `+1${digits}`;
  }

  return digits.startsWith('+') ? digits : `${countryCode}${digits}`;
};

/**
 * Generate device fingerprint for security tracking
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  try {
    // Get stored fingerprint if exists
    const storedFingerprint = await AsyncStorage.getItem('device_fingerprint');
    if (storedFingerprint) {
      return storedFingerprint;
    }

    // Generate new fingerprint based on available device info
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      // You might want to add more device-specific info using react-native-device-info
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2, 15),
    };

    const fingerprint = btoa(JSON.stringify(deviceInfo)).replace(/[^a-zA-Z0-9]/g, '');
    
    // Store for future use
    await AsyncStorage.setItem('device_fingerprint', fingerprint);
    
    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    return Math.random().toString(36).substring(2, 15);
  }
};

/**
 * Generate OTP code
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generate secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Validate OTP format
 */
export const validateOTP = (otp: string, expectedLength: number = 6): boolean => {
  const otpRegex = new RegExp(`^\\d{${expectedLength}}$`);
  return otpRegex.test(otp);
};

/**
 * Check if password has been compromised (basic check)
 */
export const isPasswordCompromised = (password: string): boolean => {
  // Basic check against common compromised passwords
  const commonPasswords = [
    '123456',
    'password',
    '123456789',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    '111111',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
  ];

  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Calculate password entropy
 */
export const calculatePasswordEntropy = (password: string): number => {
  let charSet = 0;
  
  if (/[a-z]/.test(password)) charSet += 26; // lowercase
  if (/[A-Z]/.test(password)) charSet += 26; // uppercase
  if (/\d/.test(password)) charSet += 10; // digits
  if (/[^a-zA-Z0-9]/.test(password)) charSet += 32; // special chars (approximate)

  return Math.log2(charSet) * password.length;
};

/**
 * Format time remaining for session expiry
 */
export const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (expiresAt: string): boolean => {
  return new Date() >= new Date(expiresAt);
};

/**
 * Generate backup codes for 2FA recovery
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = generateSecureToken(8).toUpperCase();
    // Format as XXXX-XXXX for readability
    const formatted = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push(formatted);
  }
  
  return codes;
};

/**
 * Mask email for privacy (show first 2 chars and domain)
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.substring(0, 2)}***@${domain}`;
};

/**
 * Mask phone number for privacy
 */
export const maskPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return '***-***-****';
  }
  
  const lastFour = digits.slice(-4);
  const countryCode = digits.slice(0, -10);
  
  if (countryCode) {
    return `+${countryCode} ***-***-${lastFour}`;
  } else {
    return `***-***-${lastFour}`;
  }
};

/**
 * Get security color based on strength/risk level
 */
export const getSecurityColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'very-weak':
    case 'critical':
      return '#DC2626'; // Red
    case 'weak':
    case 'high':
      return '#EA580C'; // Orange
    case 'fair':
    case 'medium':
      return '#CA8A04'; // Yellow
    case 'good':
    case 'low':
      return '#16A34A'; // Green
    case 'strong':
      return '#059669'; // Dark Green
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Debounce function for input validation
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Check if biometrics are available on device
 */
export const checkBiometricAvailability = async (): Promise<{
  available: boolean;
  type: string | null;
}> => {
  try {
    // This would need to be implemented with react-native-biometrics or similar
    // For now, return a mock response
    return {
      available: Platform.OS === 'ios' || Platform.OS === 'android',
      type: Platform.OS === 'ios' ? 'TouchID/FaceID' : 'Fingerprint',
    };
  } catch (error) {
    return {
      available: false,
      type: null,
    };
  }
};

/**
 * Storage helper for sensitive data
 */
export const secureStorage = {
  /**
   * Store sensitive data with encryption (if available)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // In a real implementation, you might want to use react-native-keychain
      // for more secure storage of sensitive data
      await AsyncStorage.setItem(`secure_${key}`, value);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  },

  /**
   * Retrieve sensitive data
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`secure_${key}`);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },

  /**
   * Remove sensitive data
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw error;
    }
  },

  /**
   * Clear all secure data
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('Error clearing secure data:', error);
      throw error;
    }
  },
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed based on rate limiting
   */
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create attempts array for this key
    let keyAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    keyAttempts = keyAttempts.filter(timestamp => timestamp > windowStart);

    // Check if we're within the limit
    if (keyAttempts.length >= maxAttempts) {
      return false;
    }

    // Record this attempt
    keyAttempts.push(now);
    this.attempts.set(key, keyAttempts);

    return true;
  }

  /**
   * Get remaining attempts for a key
   */
  getRemainingAttempts(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    const keyAttempts = this.attempts.get(key) || [];
    const recentAttempts = keyAttempts.filter(timestamp => timestamp > windowStart);

    return Math.max(0, maxAttempts - recentAttempts.length);
  }

  /**
   * Clear attempts for a key
   */
  clearAttempts(key: string): void {
    this.attempts.delete(key);
  }
} 