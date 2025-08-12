/**
 * Welcome Screen - Matches Original HTML Design
 * 
 * Clean, modern welcome screen for new users with social login options
 * and email-based authentication. Matches the provided design exactly.
 */

import React from 'react';
// Navigation provided via props from React Navigation
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, useColorScheme } from 'react-native';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Type fixes for React 18+ compatibility
const TypedIonicons = Ionicons as any;

interface WelcomeScreenProps { navigation: any }

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Google Sign In Error',
        'Google Sign In is not yet implemented. Please use email authentication.',
        [{ text: 'OK' }]
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      Alert.alert(
        'Apple Sign In Error',
        'Apple Sign In is not yet implemented. Please use email authentication.',
        [{ text: 'OK' }]
      );
    } finally {
      setAppleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLogIn = () => {
    navigation.navigate('Login');
  };

  const handleTermsPress = () => {
    navigation.navigate('LegalDocuments', { document: 'terms' });
  };

  const handlePrivacyPress = () => {
    navigation.navigate('LegalDocuments', { document: 'privacy' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#000000' : '#ffffff'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo} allowFontScaling={true}>RevSync</Text>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle} allowFontScaling={true}>Get Started</Text>
          <Text style={styles.welcomeSubtitle} allowFontScaling={true}>
            Unlock AI‑powered tuning, expert safety checks, and a community built for riders like you.
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <TypedIonicons name="logo-google" size={24} color="#4285F4" />
                <Text style={styles.socialButtonText} allowFontScaling={true}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            {appleLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <TypedIonicons name="logo-apple" size={24} color="#000000" />
                <Text style={styles.socialButtonText} allowFontScaling={true}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerTextContainer}>
            <Text style={styles.dividerText} allowFontScaling={true}>Or</Text>
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Authentication Buttons */}
        <View style={styles.emailButtonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEmailSignUp}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign up with email"
          >
            <Text style={styles.primaryButtonText} allowFontScaling={true}>Sign up with email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogIn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            <Text style={styles.secondaryButtonText} allowFontScaling={true}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText} allowFontScaling={true}>
          By continuing, you agree to RevSync's{' '}
          <Text style={styles.footerLink} onPress={handleTermsPress} allowFontScaling={true}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.footerLink} onPress={handlePrivacyPress} allowFontScaling={true}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111418',
    letterSpacing: -0.5,
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111418',
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#637488',
    textAlign: 'center',
    lineHeight: 24,
  },
  socialButtonsContainer: {
    marginBottom: 32,
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111418',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerTextContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
  },
  dividerText: {
    fontSize: 14,
    color: '#637488',
  },
  emailButtonsContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#0b80ee',
    borderRadius: 24,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b80ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#637488',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#637488',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '500',
    color: '#0b80ee',
  },
});

export default WelcomeScreen; 