/**
 * Authentication Type Definitions for RevSync
 * 
 * Comprehensive type definitions for all authentication-related functionality
 * including user data, sessions, errors, and security features.
 */

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  lastSignIn?: string;
  providers: SocialLoginProvider[];
  metadata?: Record<string, any>;
  
  // Onboarding status
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  
  // Profile information that might be filled during onboarding
  motorcycleType?: string;
  skillLevel?: string;
  ridingStyle?: string;
  ridingExperience?: string;
  performanceGoals?: string[];
  safetyTolerance?: string;
}

export interface UserProfile {
  // Riding Information
  ridingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredRidingStyle?: 'casual' | 'sport' | 'touring' | 'track' | 'off_road';
  safetyTolerance: 'conservative' | 'moderate' | 'aggressive';
  performanceGoals: string[];
  
  // Community Settings
  showInLeaderboards: boolean;
  allowFriendRequests: boolean;
  shareRideData: boolean;
  
  // Notification Preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  
  // Safety Acknowledgments
  safetyDisclaimerAccepted: boolean;
  safetyDisclaimerDate?: string;
  termsAccepted: boolean;
  termsAcceptedDate?: string;
  
  // Statistics
  totalTunesApplied: number;
  totalMilesLogged: number;
  safetyScore: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
  tokenType: string;
  user: AuthUser;
  
  // Session Metadata
  sessionId: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
  };
  
  // Security
  requires2FA: boolean;
  isVerified: boolean;
  createdAt: string;
  lastUsed: string;
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName?: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  userAgent?: string;
  fingerprint: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: Partial<DeviceInfo>;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  marketingOptIn?: boolean;
}

export interface SocialLoginProvider {
  provider: 'google' | 'apple' | 'facebook' | 'github';
  token: string;
  deviceInfo?: Partial<DeviceInfo>;
}

export interface MagicLinkRequest {
  email: string;
  shouldCreateUser?: boolean;
  redirectTo?: string;
}

export interface OTPVerification {
  email?: string;
  phoneNumber?: string;
  token: string;
  type: 'email' | 'sms' | 'signup' | 'recovery';
}

export interface TwoFactorConfig {
  enabled: boolean;
  secret?: string;
  qrCodeUri?: string;
  backupCodes?: string[];
  preferredMethod: 'totp' | 'sms' | 'email';
  
  // TOTP Settings
  totpConfigured: boolean;
  
  // SMS Settings
  smsConfigured: boolean;
  phoneNumber?: string;
  
  // Recovery
  backupCodesRemaining: number;
}

export interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: DeviceInfo;
  location?: {
    country?: string;
    city?: string;
  };
  resolved: boolean;
  actionTaken?: string;
}

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'email_changed'
  | 'phone_changed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'account_locked'
  | 'account_unlocked'
  | 'suspicious_activity'
  | 'new_device_login'
  | 'ip_address_change'
  | 'data_export'
  | 'account_deletion'
  | 'session_expired'
  | 'token_refresh';

export interface SessionInfo {
  id: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  location?: string;
  ipAddress?: string;
  isCurrentSession: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
}

export interface AuthState {
  // Authentication Status
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // User Data
  user: AuthUser | null;
  session: AuthSession | null;
  
  // Security
  require2FA: boolean;
  pendingVerification: boolean;
  
  // Error Handling
  error: AuthError | null;
  
  // Session Management
  sessions: SessionInfo[];
  
  // Security Events
  securityEvents: SecurityEvent[];
}

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Security Settings
  sessionTimeout: number; // in minutes
  requireEmailVerification: boolean;
  enforce2FA: boolean;
  allowSocialLogin: boolean;
  
  // Password Requirements
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  
  // Rate Limiting
  maxLoginAttempts: number;
  loginAttemptWindow: number; // in minutes
  
  // Social Providers
  enabledSocialProviders: Array<'google' | 'apple' | 'facebook' | 'github'>;
  
  // Features
  enableBiometrics: boolean;
  enableDeviceTracking: boolean;
  enableLocationTracking: boolean;
}

export interface BiometricConfig {
  available: boolean;
  enrolled: boolean;
  supportedTypes: Array<'fingerprint' | 'face' | 'iris'>;
  enabled: boolean;
}

export interface AuthContextType {
  // State
  auth: AuthState;

  // Authentication methods
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse<LoginResponse>>;
  signUp: (data: RegisterData) => Promise<AuthResponse<RegisterResponse>>;
  signOut: () => Promise<void>;
  signInWithGoogle: (deviceInfo?: Partial<DeviceInfo>) => Promise<AuthResponse<AuthSession>>;
  signInWithApple: (deviceInfo?: Partial<DeviceInfo>) => Promise<AuthResponse<AuthSession>>;

  // Password reset and management
  sendMagicLink: (request: MagicLinkRequest) => Promise<void>;
  verifyOTP: (verification: OTPVerification) => Promise<AuthSession>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  changePassword: (request: PasswordChangeRequest) => Promise<void>;

  // Two-factor authentication
  enable2FA: (password: string) => Promise<{ qrCode: string; backupCodes: string[]; secret: string }>;
  verify2FASetup: (code: string) => Promise<void>;
  disable2FA: (password: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;

  // Session management
  refreshSession: () => Promise<AuthResponse<AuthSession>>;
  getSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;

  // Profile management
  updateProfile: (updates: Partial<AuthUser>) => Promise<AuthUser>;
  uploadAvatar: (file: File | Blob) => Promise<string>;

  // Security and monitoring
  getSecurityEvents: () => Promise<SecurityEvent[]>;
  reportSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;

  // Email and phone verification
  sendEmailVerification: () => Promise<void>;
  sendPhoneVerification: (phoneNumber: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;

  // Biometric authentication
  setupBiometrics: () => Promise<BiometricConfig>;
  authenticateWithBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;

  // Utility methods
  clearError: () => void;
  checkAuthState: () => Promise<void>;
  
  // Onboarding
  completeOnboarding: (onboardingData: {
    motorcycleType: string;
    skillLevel: string;
    ridingStyle: string;
    selectedBike?: any;
    ridingExperience?: string;
    performanceGoals?: string[];
    safetyTolerance?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

// Response Types
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
  requires2FA: boolean;
  requiresVerification: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
  session?: AuthSession;
  requiresVerification: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonPatterns: boolean;
  };
} 