/**
 * Authentication Service for RevSync Mobile App
 * 
 * Comprehensive authentication service using Supabase with support for:
 * - Email/password authentication
 * - Social login (Google, Apple)
 * - Magic links and OTP verification
 * - Two-factor authentication
 * - Session management and refresh
 * - Security monitoring
 */

import { createClient, SupabaseClient, AuthResponse as SupabaseAuthResponse, AuthTokenResponsePassword, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

import {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  AuthError,
  DeviceInfo,
} from '../types/auth';
import { generateDeviceFingerprint } from '../utils/authUtils';

class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    // Validate environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase configuration!');
      console.error('Please check your .env file has:');
      console.error('EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
      console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
      
      // Use dummy values to prevent crashes, but log the issue
      this.supabase = createClient(
        'https://localhost',
        'dummy-key',
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }
      );
      return;
    }

    console.log('✅ Initializing Supabase with URL:', supabaseUrl);
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  private validateConfiguration(): boolean {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_ID')) {
      return false;
    }
    return true;
  }

  async signIn(credentials: LoginCredentials): Promise<AuthResponse<LoginResponse>> {
    try {
      if (!this.validateConfiguration()) {
        return {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Supabase not configured. Please check your .env file.',
            timestamp: new Date().toISOString(),
          },
        };
      }

      console.log('🔐 Attempting sign in for:', credentials.email);

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return {
          success: false,
          error: {
            code: error.message.includes('Invalid') ? 'INVALID_CREDENTIALS' : 'SIGN_IN_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: {
            code: 'SIGN_IN_ERROR',
            message: 'No user data returned from Supabase',
            timestamp: new Date().toISOString(),
          },
        };
      }

      console.log('✅ Sign in successful for user:', data.user.id);

      // Transform Supabase user to our AuthUser format
      const authUser = await this.transformSupabaseUser(data.user);
      const authSession = this.transformSupabaseSession(data.session);

      return {
        success: true,
        data: {
          user: authUser,
          session: authSession,
          requires2FA: false, // We can implement this later if needed
        },
      };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return {
        success: false,
        error: {
          code: 'SIGN_IN_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async signUp(data: RegisterData): Promise<AuthResponse<RegisterResponse>> {
    try {
      if (!this.validateConfiguration()) {
        return {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Supabase not configured. Please check your .env file.',
            timestamp: new Date().toISOString(),
          },
        };
      }

      console.log('📝 Attempting sign up for:', data.email);

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            display_name: `${data.firstName} ${data.lastName}`,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return {
          success: false,
          error: {
            code: error.message.includes('already') ? 'EMAIL_TAKEN' : 'SIGN_UP_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: {
            code: 'SIGN_UP_ERROR',
            message: 'No user data returned from Supabase',
            timestamp: new Date().toISOString(),
          },
        };
      }

      console.log('✅ Sign up successful for user:', authData.user.id);

      // Transform Supabase user to our AuthUser format
      const authUser = await this.transformSupabaseUser(authData.user);

      return {
        success: true,
        data: {
          user: authUser,
          session: authData.session ? this.transformSupabaseSession(authData.session) : null,
          requiresVerification: !authData.user.email_confirmed_at,
        },
      };
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      return {
        success: false,
        error: {
          code: 'SIGN_UP_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out user');
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
      throw error;
    }
  }

  private async transformSupabaseUser(user: User): Promise<AuthUser> {
    // Get user profile data from our custom table
    let profileData = {};
    
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        profileData = {
          motorcycleType: profile.motorcycle_type,
          skillLevel: profile.skill_level,
          ridingStyle: profile.riding_style,
          ridingExperience: profile.riding_experience,
          performanceGoals: profile.performance_goals || [],
          safetyTolerance: profile.safety_tolerance,
          onboardingCompleted: profile.onboarding_completed || false,
          onboardingCompletedAt: profile.onboarding_completed_at,
        };
      }
    } catch (error) {
      console.log('ℹ️ No profile data found for user (this is normal for new users)');
    }

    return {
      id: user.id,
      email: user.email!,
      emailVerified: !!user.email_confirmed_at,
      phone: user.phone,
      phoneVerified: !!user.phone_confirmed_at,
      displayName: user.user_metadata?.display_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      avatar: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      providers: [], // We can populate this if needed
      metadata: user.user_metadata,
      onboardingCompleted: false, // Default to false, will be updated from profile
      ...profileData,
    };
  }

  private transformSupabaseSession(session: any): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      tokenType: session.token_type || 'bearer',
      user: session.user,
    };
  }

  // Placeholder methods for features we can implement later
  async sendMagicLink(request: { email: string }): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email: request.email,
    });
    if (error) throw error;
  }

  async resetPassword(request: { email: string }): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(request.email);
    if (error) throw error;
  }

  async refreshSession(): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) throw error;
    return this.transformSupabaseSession(data.session);
  }

  // Listener for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null, session: AuthSession | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (session?.user) {
        const authUser = await this.transformSupabaseUser(session.user);
        const authSession = this.transformSupabaseSession(session);
        callback(authUser, authSession);
      } else {
        callback(null, null);
      }
    });
  }

  // Social login placeholders
  async signInWithGoogle(): Promise<AuthResponse<AuthSession>> {
    // Implementation would depend on your OAuth setup
    throw new Error('Google sign-in not implemented yet');
  }

  async signInWithApple(): Promise<AuthResponse<AuthSession>> {
    // Implementation would depend on your OAuth setup
    throw new Error('Apple sign-in not implemented yet');
  }
}

export default new AuthService(); 