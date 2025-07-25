/**
 * RevSync Authentication Module
 * 
 * Comprehensive authentication system with Supabase integration for:
 * - Email/password authentication
 * - Social login (Google, Apple)
 * - Magic links and OTP verification
 * - Two-factor authentication
 * - Session management
 * - Security monitoring
 */

export { default as AuthService } from './services/AuthService';
// export { default as SessionManager } from './services/SessionManager';
// export { default as SecurityService } from './services/SecurityService';

// Auth Screens
export { default as WelcomeScreen } from './screens/WelcomeScreen';
export { default as LoginScreen } from './screens/LoginScreen';
export { default as RegisterScreen } from './screens/RegisterScreen';
export { default as ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
// export { default as VerifyEmailScreen } from './screens/VerifyEmailScreen';
// export { default as TwoFactorScreen } from './screens/TwoFactorScreen';
// export { default as Setup2FAScreen } from './screens/Setup2FAScreen';

// Auth Components
// export { default as AuthGuard } from './components/AuthGuard';
// export { default as SocialLoginButtons } from './components/SocialLoginButtons';
export { default as PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
// export { default as OTPInput } from './components/OTPInput';
// export { default as BiometricAuth } from './components/BiometricAuth';

// Auth Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Types
export type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthError,
  TwoFactorConfig,
  SecurityEvent,
  SessionInfo,
  AuthState,
  AuthContextType,
  PasswordStrengthResult,
} from './types/auth';

// Utils
export {
  validateEmail,
  validatePassword,
  formatPhoneNumber,
  generateDeviceFingerprint,
  getSecurityColor,
  maskEmail,
  maskPhoneNumber,
} from './utils/authUtils'; 