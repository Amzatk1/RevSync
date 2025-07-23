import React, { useEffect } from "react";
import { StatusBar, Platform } from "react-native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { store } from "./store";
import { AwardWinningTheme as Theme } from "./styles/awardWinningTheme";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import { ErrorBoundary, initializeMonitoring } from "./config/monitoring";

const isDark = false; // Using light theme for award-winning design
const isIOS = Platform.OS === "ios";

// 🆓 FREE Error Fallback Component
const AppErrorFallback: React.FC = () => {
  const colors = Theme.colors;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: isDark
          ? colors.ios?.systemBackground || colors.material3?.background
          : colors.ios?.systemBackground || colors.material3?.background,
      }}
    >
      <Text
        style={{
          fontSize: Theme.typography.ios?.title1.fontSize || 24,
          fontWeight: "bold",
          color: colors.revsync.primary,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        🏍️ RevSync
      </Text>
      <Text
        style={{
          fontSize: Theme.typography.ios?.callout.fontSize || 16,
          marginBottom: 16,
          textAlign: "center",
          color: isDark
            ? colors.ios?.label || colors.material3?.onBackground
            : colors.ios?.label || colors.material3?.onBackground,
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: Theme.typography.ios?.footnote.fontSize || 13,
          textAlign: "center",
          color: isDark
            ? colors.ios?.secondaryLabel || colors.material3?.onSurfaceVariant
            : colors.ios?.secondaryLabel || colors.material3?.onSurfaceVariant,
          lineHeight: 20,
        }}
      >
        We're sorry for the inconvenience. Please restart the app to continue
        discovering amazing motorcycle tunes!
      </Text>
    </View>
  );
};

// Main app content that uses theme

const App: React.FC = () => {
  useEffect(() => {
    initializeMonitoring();
  }, []);

  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar
              barStyle={isDark ? "light-content" : "dark-content"}
              backgroundColor={isDark ? "#1a1a1a" : "#ffffff"}
              translucent={isIOS}
            />
            <BottomTabNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
