/**
 * Django Backend Authentication Service for RevSync Web App
 * 
 * Direct integration with Django REST API for authentication.
 * This service communicates with the Django backend instead of Supabase.
 */

import {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  AuthError,
  PasswordResetRequest,
} from '../types/auth';

interface DjangoAuthResponse<T = any> {
  user?: any;
  tokens?: {
    access: string;
    refresh: string;
  };
  message?: string;
  [key: string]: any;
}

class DjangoAuthService {
  private baseURL: string;

  constructor() {
    // Use the backend API URL from environment or default to localhost
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    console.log('✅ Django Auth Service initialized with URL:', this.baseURL);
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
      (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`🔄 Making request to ${url}`, config);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Request failed (${response.status}):`, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log(`✅ Request successful:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Request error:`, error);
      throw error;
    }
  }

  private transformDjangoUser(djangoUser: any): AuthUser {
    return {
      id: djangoUser.id?.toString() || '',
      email: djangoUser.email || '',
      emailVerified: djangoUser.is_verified || false,
      phone: djangoUser.phone_number || undefined,
      phoneVerified: false,
      displayName: djangoUser.full_name || `${djangoUser.first_name || ''} ${djangoUser.last_name || ''}`.trim(),
      firstName: djangoUser.first_name || undefined,
      lastName: djangoUser.last_name || undefined,
      avatar: djangoUser.avatar_url || undefined,
      createdAt: djangoUser.join_date || djangoUser.date_joined || new Date().toISOString(),
      lastSignIn: djangoUser.last_login || undefined,
      providers: [],
      metadata: {},
      onboardingCompleted: djangoUser.onboarding_completed || false,
      onboardingCompletedAt: djangoUser.onboarding_completed_at || undefined,
    };
  }

  private transformDjangoSession(tokens: { access: string; refresh: string }): AuthSession {
    // Store tokens in localStorage
    localStorage.setItem('authToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);

    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      tokenType: 'bearer',
      user: null as any, // Will be set by caller
    };
  }

  async signIn(credentials: LoginCredentials): Promise<AuthResponse<LoginResponse>> {
    try {
      console.log('🔐 Attempting Django login for:', credentials.email);

      const response: DjangoAuthResponse = await this.makeRequest('/users/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (response.user && response.tokens) {
        const authUser = this.transformDjangoUser(response.user);
        const authSession = this.transformDjangoSession(response.tokens);

        console.log('✅ Django login successful for user:', authUser.id);

        return {
          success: true,
          data: {
            user: authUser,
            session: authSession,
            requires2FA: false,
            requiresVerification: !authUser.emailVerified,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'SIGN_IN_ERROR',
          message: 'Invalid response from server',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Django login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      let errorCode = 'SIGN_IN_ERROR';

      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Authentication service not available';
          errorCode = 'SERVICE_UNAVAILABLE';
        } else if (error.message.includes('400') || error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password';
          errorCode = 'INVALID_CREDENTIALS';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async signUp(data: RegisterData): Promise<AuthResponse<RegisterResponse>> {
    try {
      console.log('📝 Attempting Django registration for:', data.email);

      const response: DjangoAuthResponse = await this.makeRequest('/users/auth/register/', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          username: data.email.split('@')[0], // Use email prefix as username
          password: data.password,
          password_confirm: data.confirmPassword,
          first_name: data.firstName,
          last_name: data.lastName,
        }),
      });

      if (response.user && response.tokens) {
        const authUser = this.transformDjangoUser(response.user);
        const authSession = this.transformDjangoSession(response.tokens);

        console.log('✅ Django registration successful for user:', authUser.id);

        return {
          success: true,
          data: {
            user: authUser,
            session: authSession,
            requiresVerification: !authUser.emailVerified,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'SIGN_UP_ERROR',
          message: 'Invalid response from server',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Django registration error:', error);
      
      let errorMessage = 'Registration failed';
      let errorCode = 'SIGN_UP_ERROR';

      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('unique')) {
          errorMessage = 'An account with this email already exists';
          errorCode = 'EMAIL_TAKEN';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out user');
      
      // Clear stored tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Still clear local tokens even if request fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { user: null, session: null };
      }

      console.log('👤 Getting current user profile');

      const response = await this.makeRequest('/users/profile/');
      
      if (response) {
        const authUser = this.transformDjangoUser(response);
        const refreshToken = localStorage.getItem('refreshToken') || '';
        
        const authSession: AuthSession = {
          accessToken: token,
          refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tokenType: 'bearer',
          user: null as any,
        };

        return { user: authUser, session: authSession };
      }

      return { user: null, session: null };
    } catch (error) {
      console.error('❌ Get current user error:', error);
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return { user: null, session: null };
    }
  }

  async resetPassword(request: PasswordResetRequest): Promise<void> {
    try {
      await this.makeRequest('/users/auth/password/reset/', {
        method: 'POST',
        body: JSON.stringify({
          email: request.email,
        }),
      });
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
  }

  async sendEmailVerification(): Promise<void> {
    try {
      await this.makeRequest('/users/auth/verify-email/', {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token;
  }
}

export default new DjangoAuthService();
