/**
 * Register Page - World-Class RevSync Implementation
 * 
 * Premium motorcycle tuning platform registration with stunning design,
 * comprehensive validation, password strength, and accessibility.
 * Features RevSync branding and legal compliance.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePassword } from '../../utils/authUtils';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Users,
  Gauge,
} from 'lucide-react';

const RegisterPage: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingOptIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState(validatePassword(''));
  const [isFormFocused, setIsFormFocused] = useState(false);

  // Social login state
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const { signUp, signInWithGoogle, signInWithApple, auth, clearError } = useAuth();
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
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    clearError();

    // Update password strength in real-time
    if (name === 'password' && typeof fieldValue === 'string') {
      setPasswordStrength(validatePassword(fieldValue));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = passwordStrength.feedback[0] || 'Password requirements not met';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);
    try {
      const result = await signUp({
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        agreeToTerms: formData.agreeToTerms,
        agreeToPrivacy: formData.agreeToPrivacy,
        marketingOptIn: formData.marketingOptIn,
      });

      if (result.success) {
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: 'Registration failed. Please try again.'
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading('google');
      await signInWithGoogle();
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setSocialLoading('apple');
      await signInWithApple();
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Apple sign in error:', error);
    } finally {
      setSocialLoading(null);
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
              Join the future of
              <span className="block text-red-200">motorcycle tuning</span>
            </h1>

            <p className="text-red-100 text-lg mb-8 leading-relaxed">
              Connect with expert tuners, access AI-powered recommendations, and push your bike's performance to the limit.
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

      {/* Right Side - Registration Form */}
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
              Create Account
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Join the RevSync community today
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-6 xl:mb-8">
            <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400 text-sm xl:text-base">
              Start your tuning journey with RevSync
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border ${
                        errors.firstName
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border ${
                        errors.lastName
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                    } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
                    autoComplete="new-password"
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
                    placeholder="Create a strong password"
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
                  <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                )}
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3">
                    <PasswordStrengthIndicator
                      password={formData.password}
                      result={passwordStrength}
                    />
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    className={`block w-full pl-10 pr-12 py-3 sm:py-3.5 border ${
                      errors.confirmPassword
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-gray-600 focus:border-red-500 focus:ring-red-500/30'
                    } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-700/50 text-white transition-all duration-200 text-sm sm:text-base`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-400 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Privacy Agreements */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-red-600 border-gray-600 rounded focus:ring-red-500 focus:ring-offset-gray-800 bg-gray-700"
                    />
                    <div className="text-sm text-gray-300">
                      I agree to the{' '}
                      <Link to="/settings/legal/terms" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                        Terms of Service
                      </Link>
                    </div>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 ml-7 text-sm text-red-400">{errors.agreeToTerms}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToPrivacy"
                      checked={formData.agreeToPrivacy}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-red-600 border-gray-600 rounded focus:ring-red-500 focus:ring-offset-gray-800 bg-gray-700"
                    />
                    <div className="text-sm text-gray-300">
                      I agree to the{' '}
                      <Link to="/settings/legal/privacy" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                        Privacy Policy
                      </Link>
                    </div>
                  </label>
                  {errors.agreeToPrivacy && (
                    <p className="mt-1 ml-7 text-sm text-red-400">{errors.agreeToPrivacy}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="marketingOptIn"
                      checked={formData.marketingOptIn}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-red-600 border-gray-600 rounded focus:ring-red-500 focus:ring-offset-gray-800 bg-gray-700"
                    />
                    <div className="text-sm text-gray-300">
                      Send me updates about new features and tuning tips
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formLoading}
                className="group relative w-full flex justify-center items-center py-3 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
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
                onClick={handleGoogleSignIn}
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
                onClick={handleAppleSignIn}
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
          </div>

          {/* Login link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
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

export default RegisterPage;