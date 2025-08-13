/**
 * Forgot Password Page - World-Class RevSync Implementation
 * 
 * Premium motorcycle tuning platform password reset with stunning design,
 * comprehensive validation, and accessibility.
 * Features RevSync branding and legal compliance.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/authUtils';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  Zap,
  Users,
  Gauge,
} from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormFocused, setIsFormFocused] = useState(false);

  const { resetPassword, auth, clearError } = useAuth();
  const navigate = useNavigate();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    clearError();
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.response?.data?.message) {
        setErrors({ email: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to send reset email. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/auth/login');
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
              Reset your password
              <span className="block text-red-200">securely</span>
            </h1>

            <p className="text-red-100 text-lg mb-8 leading-relaxed">
              We'll help you get back to tuning with a secure password reset process.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-red-100">
                Secure password reset
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-red-100">Quick account recovery</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-red-100">24/7 support available</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gauge className="h-5 w-5" />
              </div>
              <span className="text-red-100">Return to performance tuning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Password Reset Form */}
      <div className="flex-1 lg:w-1/2 xl:w-3/5 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="auth-container w-full max-w-md lg:max-w-lg xl:max-w-xl transform transition-all duration-700 ease-out opacity-0 translate-y-4">
          {/* Go Back Button */}
          <div className="mb-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
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
              {isSubmitted ? 'Check Your Email' : 'Reset Password'}
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              {isSubmitted 
                ? 'We\'ve sent reset instructions to your email'
                : 'Enter your email to reset your password'
              }
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-6 xl:mb-8">
            <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              {isSubmitted ? 'Check Your Email' : 'Reset Password'}
            </h1>
            <p className="text-gray-400 text-sm xl:text-base">
              {isSubmitted 
                ? 'We\'ve sent reset instructions to your email'
                : 'Enter your email address to receive reset instructions'
              }
            </p>
          </div>

          <div
            className={`bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/50 p-6 sm:p-8 transition-all duration-300 ${isFormFocused ? 'shadow-2xl scale-[1.02] border-red-500/30' : ''}`}
          >
            {isSubmitted ? (
              /* Success State */
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4">
                  Reset Instructions Sent
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  We've sent password reset instructions to{' '}
                  <span className="font-medium text-red-400">{email}</span>.
                  Check your inbox and follow the link to reset your password.
                </p>

                <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-300">
                    <strong>Didn't receive the email?</strong>
                    <br />
                    Check your spam folder or{' '}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Back to Login</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Having trouble?{' '}
                    <Link
                      to="/support"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Contact Support
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* Form State */
              <>
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

                {/* Password Reset Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={handleInputChange}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border ${
                          errors.email
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                            : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                        } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Instructions</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </form>

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    We'll send you a secure link to reset your password.{' '}
                    <br className="sm:hidden" />
                    The link will expire in 1 hour for security.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Login link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <Link
                  to="/support"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Contact Support
                </Link>{' '}
                •{' '}
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

export default ForgotPasswordPage;