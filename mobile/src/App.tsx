import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Auth System
import { 
  AuthProvider, 
  useAuth, 
  WelcomeScreen, 
  LoginScreen, 
  RegisterScreen, 
  ForgotPasswordScreen 
} from './auth';

// Onboarding
import OnboardingScreen from './screens/OnboardingScreen';
import WelcomeOnboardingScreen from './screens/WelcomeOnboardingScreen';

// Main App Navigation
import BottomTabNavigator from './navigation/BottomTabNavigator';

// Legal/Settings
import { SettingsScreen } from './settings';
import LegalDocuments from './settings/screens/LegalDocuments';

const Stack = createStackNavigator();

// Component to handle navigation based on auth and onboarding status
const AppNavigator: React.FC = () => {
  const { auth } = useAuth();
  
  // Show loading screen while auth is initializing
  if (auth.isLoading || !auth.isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0b80ee" />
      </View>
    );
  }

  // User is not authenticated - show auth flow
  if (!auth.isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="LegalDocuments" component={LegalDocuments} />
      </Stack.Navigator>
    );
  }

  // User is authenticated but hasn't completed onboarding
  if (!auth.user?.onboardingCompleted) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="WelcomeOnboarding" 
          component={WelcomeOnboardingScreen} 
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          initialParams={{ 
            onComplete: () => {
              // Onboarding completion is handled by the AuthContext
              // User will automatically be redirected to main app
            }
          }}
        />
      </Stack.Navigator>
    );
  }

  // User is authenticated and has completed onboarding - show main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LegalDocuments" component={LegalDocuments} />
    </Stack.Navigator>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;
