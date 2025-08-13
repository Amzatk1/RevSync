/**
 * Login Page - World-Class RevSync Implementation
 * 
 * Premium motorcycle tuning platform login with stunning design,
 * comprehensive validation, error handling, and accessibility.
 * Inspired by world-class design patterns with RevSync branding.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/authUtils';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Users,
  Gauge,
} from 'lucide-react';

const LoginPage: React.FC = () => {
  // Traditional form state
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormFocused, setIsFormFocused] = useState(false);

  // Social login state
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const {
    signIn,
    signInWithGoogle,
    signInWithApple,
    auth,
    clearError,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Add entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector('.auth-container');
      if (container) {
        container.classList.remove('opacity-0', 'translate-y-4');
        container.classList.add('opacity-100', 'translate-y-0');
      }
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    clearError();
  };

  // Traditional login with backend
  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    try {
      const result = await signIn({
        email: formData.emailOrUsername.trim(),
        password: formData.password,
        rememberMe: true,
      });

      if (result.success) {
        // Small delay to ensure auth state updates before navigation
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        // Handle specific error message
      } else {
        setErrors({
          general: 'Login failed. Please check your credentials and try again.'
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Social login handlers
  const handleGoogleLogin = async () => {
    try {
      setSocialLoading('google');
      await signInWithGoogle();
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setSocialLoading('apple');
      await signInWithApple();
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Apple login error:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGuestAccess = async () => {
    try {
      // Navigate to guest mode (if implemented)
      navigate('/dashboard?guest=true');
    } catch (error) {
      console.error('Error entering guest mode:', error);
    }
  };

  // Go back functionality
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 dark:from-neutral-950 dark:via-neutral-900 dark:to-gray-950 flex flex-col lg:flex-row">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full blur-md animate-bounce"></div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16 text-white">
          <div className="mb-8">
            <div
              className="flex items-center mb-6 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="h-10 w-10 bg-white/20 rounded-xl p-2 shadow-lg hover:scale-105 transition-transform duration-200 border border-white/30 backdrop-blur-10 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">R</span>
                </div>
              </div>
              <span className="ml-4 text-2xl font-bold hover:text-red-200 transition-colors duration-200">
                RevSync
              </span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight">
              Welcome back to your
              <span className="block text-red-200">tuning journey</span>
            </h1>

            <p className="text-red-100 text-lg mb-8 leading-relaxed">
              Continue pushing the limits with AI-powered ECU analysis, premium tunes, and expert community insights.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-red-100">
                AI-powered ECU analysis
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-red-100">Safety-first tuning</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-red-100">Premium tuner marketplace</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gauge className="h-5 w-5" />
              </div>
              <span className="text-red-100">Performance optimization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 xl:w-3/5 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="auth-container w-full max-w-md lg:max-w-lg xl:max-w-xl transform transition-all duration-700 ease-out opacity-0 translate-y-4">
          {/* Go Back Button */}
          <div className="mb-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <div className="h-12 w-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-2 shadow-lg group-hover:scale-105 transition-transform duration-200 border border-red-400/30 backdrop-blur-10 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">R</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Sign in to continue tuning smarter
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-6 xl:mb-8">
            <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-400 text-sm xl:text-base">
              Sign in to your account to continue
            </p>
          </div>

          <div
            className={`bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/50 p-6 sm:p-8 transition-all duration-300 ${isFormFocused ? 'shadow-2xl scale-[1.02] border-red-500/30' : ''}`}
          >
            {/* Error Message */}
            {(auth.error || errors.general) && (
              <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30">
                <div className="flex">
                  <Shield className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-300">
                      {auth.error?.message || errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Traditional Login Form */}
            <form
              onSubmit={handleTraditionalLogin}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label
                    htmlFor="emailOrUsername"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="emailOrUsername"
                      name="emailOrUsername"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.emailOrUsername}
                      onChange={handleInputChange}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border ${
                        errors.emailOrUsername
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                      placeholder="Enter your email or username"
                    />
                  </div>
                  {errors.emailOrUsername && (
                    <p className="mt-2 text-sm text-red-400 animate-slide-down">
                      {errors.emailOrUsername}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      className={`block w-full pl-10 pr-12 py-3 sm:py-3.5 border ${
                        errors.password
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-400 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400 animate-slide-down">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/auth/forgot-password"
                    className="font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="group relative w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 sm:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800/50 text-gray-400 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={socialLoading === 'google' || auth.isLoading}
                className="w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-gray-600 rounded-xl shadow-sm text-sm sm:text-base font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {socialLoading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={socialLoading === 'apple' || auth.isLoading}
                className="w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-gray-600 rounded-xl shadow-sm text-sm sm:text-base font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {socialLoading === 'apple' ? (
                  <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Continue with Apple
                  </>
                )}
              </button>
            </div>

            {/* Guest Access */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm sm:text-base font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Continue as Guest
              </button>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/auth/register"
                className="font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                Sign up for free
              </Link>
            </p>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <Link
                  to="/settings/legal/terms"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/settings/legal/privacy"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
