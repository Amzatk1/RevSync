/**
 * Email Verification Page - World-Class RevSync Implementation
 * 
 * Premium motorcycle tuning platform email verification with stunning design,
 * comprehensive states, and accessibility.
 * Features RevSync branding and legal compliance.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Users,
  Gauge,
} from 'lucide-react';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired' | 'resend';

const EmailVerificationPage: React.FC = () => {
  const [verificationState, setVerificationState] = useState<VerificationState>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [searchParams] = useSearchParams();

  const { verifyEmail, sendEmailVerification, auth, clearError } = useAuth();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email') || auth.user?.email || '';

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

  // Verify email on component mount if token is present
  useEffect(() => {
    const performVerification = async () => {
      if (token) {
        try {
          await verifyEmail(token);
          setVerificationState('success');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } catch (error: any) {
          console.error('Email verification error:', error);
          const errorMessage = error.response?.data?.message || error.message;
          
          if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            setVerificationState('expired');
          } else {
            setVerificationState('error');
          }
        }
      } else if (!email) {
        // No token and no email, redirect to login
        navigate('/auth/login');
      } else {
        // No token but have email, show resend option
        setVerificationState('resend');
      }
    };

    performVerification();
  }, [token, email, verifyEmail, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error: any) {
      console.error('Resend verification error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/auth/login');
    }
  };

  const getStateContent = () => {
    switch (verificationState) {
      case 'verifying':
        return {
          icon: <Clock className="w-8 h-8 text-blue-400 animate-pulse" />,
          title: 'Verifying Your Email',
          description: 'Please wait while we verify your email address...',
          color: 'blue',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-400" />,
          title: 'Email Verified!',
          description: 'Your email has been successfully verified. Redirecting to your dashboard...',
          color: 'green',
        };
      case 'error':
        return {
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          title: 'Verification Failed',
          description: 'We couldn\'t verify your email. The link may be invalid or already used.',
          color: 'red',
        };
      case 'expired':
        return {
          icon: <XCircle className="w-8 h-8 text-orange-400" />,
          title: 'Link Expired',
          description: 'This verification link has expired. Please request a new one.',
          color: 'orange',
        };
      case 'resend':
        return {
          icon: <Mail className="w-8 h-8 text-blue-400" />,
          title: 'Verify Your Email',
          description: 'Please check your email and click the verification link to activate your account.',
          color: 'blue',
        };
      default:
        return {
          icon: <Mail className="w-8 h-8 text-blue-400" />,
          title: 'Email Verification',
          description: 'Verify your email to continue',
          color: 'blue',
        };
    }
  };

  const stateContent = getStateContent();

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
              Secure email
              <span className="block text-red-200">verification</span>
            </h1>

            <p className="text-red-100 text-lg mb-8 leading-relaxed">
              We're verifying your email to ensure secure access to your tuning data and premium features.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-red-100">
                Secure account protection
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-red-100">Instant access to premium features</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-red-100">Join verified tuner community</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gauge className="h-5 w-5" />
              </div>
              <span className="text-red-100">Performance optimization ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Verification Content */}
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
              {stateContent.title}
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              {verificationState === 'verifying' ? 'Verifying your email address...' : 'Email verification'}
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-6 xl:mb-8">
            <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              {stateContent.title}
            </h1>
            <p className="text-gray-400 text-sm xl:text-base">
              Email verification process
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/50 p-6 sm:p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  stateContent.color === 'green' ? 'bg-green-500/20' :
                  stateContent.color === 'red' ? 'bg-red-500/20' :
                  stateContent.color === 'orange' ? 'bg-orange-500/20' :
                  'bg-blue-500/20'
                }`}>
                  {stateContent.icon}
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="text-xl font-semibold text-white mb-4">
                {stateContent.title}
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                {stateContent.description}
                {email && verificationState !== 'verifying' && (
                  <>
                    <br />
                    <span className="font-medium text-red-400">{email}</span>
                  </>
                )}
              </p>

              {/* Resend Success Message */}
              {resendSuccess && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    ✓ Verification email sent successfully! Check your inbox.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {verificationState === 'verifying' && (
                  <div className="py-4">
                    <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                )}

                {verificationState === 'success' && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}

                {(verificationState === 'error' || verificationState === 'expired' || verificationState === 'resend') && (
                  <>
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending || !email}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isResending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Resend Verification Email</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('/auth/login')}
                      className="w-full flex justify-center items-center py-3 px-4 border border-gray-600 rounded-xl text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>

              {/* Help Text */}
              {verificationState !== 'success' && verificationState !== 'verifying' && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <Link
                      to="/support"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      contact support
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="text-xs text-gray-500">
              <Link
                to="/settings/legal/terms"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Terms of Service
              </Link>{' '}
              •{' '}
              <Link
                to="/settings/legal/privacy"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              •{' '}
              <Link
                to="/support"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;