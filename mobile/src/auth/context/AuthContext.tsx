/**
 * Auth Context - Authentication State Management
 * 
 * Provides authentication state and methods to the entire app using React Context.
 * Integrates with the Supabase AuthService and manages global auth state.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import {
  AuthContextType,
  AuthState,
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthError,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
} from '../types/auth';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  user: null,
  session: null,
  require2FA: false,
  pendingVerification: false,
  error: null,
  sessions: [],
  securityEvents: [],
};

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; session: AuthSession } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: AuthError | null }
  | { type: 'SET_REQUIRE_2FA'; payload: boolean }
  | { type: 'SET_PENDING_VERIFICATION'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'UPDATE_SESSION'; payload: AuthSession };

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
        require2FA: false,
        pendingVerification: false,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        session: null,
        require2FA: false,
        pendingVerification: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_REQUIRE_2FA':
      return { ...state, require2FA: action.payload };
    
    case 'SET_PENDING_VERIFICATION':
      return { ...state, pendingVerification: action.payload };
    
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    
    case 'UPDATE_SESSION':
      return { ...state, session: action.payload };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state and listeners
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_ID')) {
          console.error('❌ Supabase not configured!');
          dispatch({ 
            type: 'SET_ERROR', 
            payload: {
              code: 'CONFIGURATION_ERROR',
              message: 'Authentication not configured. Please check your .env file.',
              timestamp: new Date().toISOString(),
            }
          });
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          return;
        }

        console.log('✅ Initializing auth with Supabase...');

        // Set up auth state listener
        const { data: { subscription } } = AuthService.onAuthStateChange(
          (user: AuthUser | null, session: AuthSession | null) => {
            console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
            
            if (user && session) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, session },
              });
            } else {
              dispatch({ type: 'LOGOUT' });
            }
          }
        );

        // Get initial session
        try {
          const session = await AuthService.refreshSession();
          if (session) {
            console.log('✅ Restored existing session');
          }
        } catch (error) {
          console.log('ℹ️ No existing session found');
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true });
        
        // Cleanup listener on unmount
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: {
            code: 'INITIALIZATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to initialize authentication',
            timestamp: new Date().toISOString(),
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Authentication methods
  const signIn = async (credentials: LoginCredentials): Promise<AuthResponse<LoginResponse>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.signIn(credentials);
      
      if (result.success && result.data) {
        if (result.data.requires2FA) {
          dispatch({ type: 'SET_REQUIRE_2FA', payload: true });
        } else {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: result.data.user, session: result.data.session },
          });
          
          // Check if user has completed onboarding
          if (!result.data.user.onboardingCompleted) {
            // User needs to complete onboarding - navigation will be handled by App.tsx
            console.log('User needs to complete onboarding');
          } else {
            // User can go directly to main app
            console.log('User can access main app');
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || null });
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'SIGN_IN_ERROR',
        message: 'An unexpected error occurred during sign in',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ERROR', payload: authError });
      return { success: false, error: authError };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signUp = async (data: RegisterData): Promise<AuthResponse<RegisterResponse>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.signUp(data);
      
      if (result.success && result.data) {
        if (result.data.requiresVerification) {
          dispatch({ type: 'SET_PENDING_VERIFICATION', payload: true });
        } else if (result.data.session) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: result.data.user, session: result.data.session },
          });
          
          // New users always need to complete onboarding
          console.log('New user registered - needs onboarding');
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || null });
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'SIGN_UP_ERROR',
        message: 'An unexpected error occurred during registration',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ERROR', payload: authError });
      return { success: false, error: authError };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (state.session) {
        await AuthService.signOut();
      }
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if remote sign out fails
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse<AuthSession>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.signInWithGoogle();
      
      if (result.success && result.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: result.data.user, session: result.data },
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || null });
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'GOOGLE_SIGN_IN_ERROR',
        message: 'Google Sign In failed',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ERROR', payload: authError });
      return { success: false, error: authError };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signInWithApple = async (): Promise<AuthResponse<AuthSession>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await AuthService.signInWithApple();
      
      if (result.success && result.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: result.data.user, session: result.data },
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || null });
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'APPLE_SIGN_IN_ERROR',
        message: 'Apple Sign In failed',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ERROR', payload: authError });
      return { success: false, error: authError };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshSession = async (): Promise<AuthResponse<AuthSession>> => {
    try {
      const result = await AuthService.refreshSession();
      
      if (result.success && result.data) {
        dispatch({ type: 'UPDATE_SESSION', payload: result.data });
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'SESSION_REFRESH_ERROR',
        message: 'Failed to refresh session',
        timestamp: new Date().toISOString(),
      };
      return { success: false, error: authError };
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const checkAuthState = async (): Promise<void> => {
    await initializeAuth();
  };

  const completeOnboarding = async (onboardingData: {
    motorcycleType: string;
    skillLevel: string;
    ridingStyle: string;
    selectedBike?: any;
    ridingExperience?: string;
    performanceGoals?: string[];
    safetyTolerance?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!state.user || !state.session) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('💾 Saving onboarding data to Supabase...');

      // Import Supabase client directly for this operation
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Update user profile with onboarding data
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          motorcycle_type: onboardingData.motorcycleType,
          skill_level: onboardingData.skillLevel,
          riding_style: onboardingData.ridingStyle,
          riding_experience: onboardingData.ridingExperience,
          performance_goals: onboardingData.performanceGoals || [],
          safety_tolerance: onboardingData.safetyTolerance,
          selected_bike_data: onboardingData.selectedBike,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', state.user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save onboarding data:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Onboarding data saved successfully!');

      // Update user state with onboarding completion
      const updatedUser: AuthUser = {
        ...state.user,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        motorcycleType: onboardingData.motorcycleType,
        skillLevel: onboardingData.skillLevel,
        ridingStyle: onboardingData.ridingStyle,
        ridingExperience: onboardingData.ridingExperience,
        performanceGoals: onboardingData.performanceGoals,
        safetyTolerance: onboardingData.safetyTolerance,
      };

      dispatch({ type: 'UPDATE_USER', payload: updatedUser });

      return { success: true };
    } catch (error) {
      console.error('❌ Complete onboarding error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  // Placeholder implementations for features not yet implemented
  const sendMagicLink = async (): Promise<void> => {
    throw new Error('Magic links not yet implemented');
  };

  const verifyOTP = async (): Promise<AuthSession> => {
    throw new Error('OTP verification not yet implemented');
  };

  const resetPassword = async (): Promise<void> => {
    throw new Error('Password reset not yet implemented');
  };

  const changePassword = async (): Promise<void> => {
    throw new Error('Password change not yet implemented');
  };

  const enable2FA = async () => {
    throw new Error('2FA not yet implemented');
  };

  const verify2FASetup = async (): Promise<void> => {
    throw new Error('2FA setup not yet implemented');
  };

  const disable2FA = async (): Promise<void> => {
    throw new Error('2FA disable not yet implemented');
  };

  const verify2FA = async (): Promise<void> => {
    throw new Error('2FA verification not yet implemented');
  };

  const getSessions = async () => {
    return [];
  };

  const revokeSession = async (): Promise<void> => {
    throw new Error('Session revocation not yet implemented');
  };

  const revokeAllSessions = async (): Promise<void> => {
    throw new Error('Session revocation not yet implemented');
  };

  const updateProfile = async () => {
    throw new Error('Profile update not yet implemented');
  };

  const uploadAvatar = async (): Promise<string> => {
    throw new Error('Avatar upload not yet implemented');
  };

  const getSecurityEvents = async () => {
    return [];
  };

  const reportSecurityEvent = async (): Promise<void> => {
    // This is handled by AuthService
  };

  const sendEmailVerification = async (): Promise<void> => {
    throw new Error('Email verification not yet implemented');
  };

  const sendPhoneVerification = async (): Promise<void> => {
    throw new Error('Phone verification not yet implemented');
  };

  const verifyEmail = async (): Promise<void> => {
    throw new Error('Email verification not yet implemented');
  };

  const verifyPhone = async (): Promise<void> => {
    throw new Error('Phone verification not yet implemented');
  };

  const setupBiometrics = async () => {
    throw new Error('Biometrics not yet implemented');
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    throw new Error('Biometrics not yet implemented');
  };

  const disableBiometrics = async (): Promise<void> => {
    throw new Error('Biometrics not yet implemented');
  };

  // Context value
  const value: AuthContextType = {
    auth: state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
    sendMagicLink,
    verifyOTP,
    resetPassword,
    changePassword,
    enable2FA,
    verify2FASetup,
    disable2FA,
    verify2FA,
    refreshSession,
    getSessions,
    revokeSession,
    revokeAllSessions,
    updateProfile,
    uploadAvatar,
    getSecurityEvents,
    reportSecurityEvent,
    sendEmailVerification,
    sendPhoneVerification,
    verifyEmail,
    verifyPhone,
    setupBiometrics,
    authenticateWithBiometrics,
    disableBiometrics,
    clearError,
    checkAuthState,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 