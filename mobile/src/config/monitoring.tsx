import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React from "react";
import { View, Text } from "react-native";

// FREE Performance and Error Monitoring Configuration
// Using React Native built-in APIs and AsyncStorage

interface ErrorLog {
  timestamp: string;
  error: string;
  context?: string;
  userAgent: string;
  userId?: string;
}

interface PerformanceLog {
  timestamp: string;
  event: string;
  duration: number;
  context?: string;
}

export const initializeMonitoring = () => {
  // Set up global error handler (FREE)
  if (!__DEV__) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Log to local storage for later review
      logErrorLocally(new Error(args.join(" ")), "console_error");
      originalConsoleError(...args);
    };

    // Set up unhandled promise rejection handler
    if (typeof global !== "undefined") {
      global.onunhandledrejection = (event: any) => {
        logErrorLocally(new Error(event.reason), "unhandled_promise");
        console.error("Unhandled promise rejection:", event.reason);
      };
    }
  }

  // Initialize performance tracking
  console.log("🚀 RevSync Monitoring initialized (FREE version)");
};

// FREE Error logging using AsyncStorage
const logErrorLocally = async (error: Error, context?: string) => {
  try {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      context,
      userAgent: Constants.platform?.ios ? "iOS" : "Android",
    };

    // Store in AsyncStorage (FREE local storage)
    const existingLogs = await AsyncStorage.getItem("error_logs");
    const logs = existingLogs ? JSON.parse(existingLogs) : [];

    // Keep only last 50 errors to avoid storage bloat
    if (logs.length >= 50) {
      logs.shift();
    }

    logs.push(errorLog);
    await AsyncStorage.setItem("error_logs", JSON.stringify(logs));
  } catch (storageError) {
    console.error("Failed to log error locally:", storageError);
  }
};

// FREE Performance tracking using built-in APIs
export class PerformanceTracker {
  private static startTimes = new Map<string, number>();

  static startTransaction(name: string, description?: string) {
    const startTime = Date.now();
    this.startTimes.set(name, startTime);

    if (__DEV__) {
      console.log(
        `⏱️ Started: ${name} ${description ? `(${description})` : ""}`
      );
    }

    return { name, startTime };
  }

  static async finishTransaction(name: string) {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      return;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(name);

    // Log performance data locally
    await this.logPerformanceLocally({
      timestamp: new Date().toISOString(),
      event: name,
      duration,
    });

    if (__DEV__) {
      console.log(`✅ Finished: ${name} (${duration}ms)`);
    }
  }

  static trackMarketplaceEvent(
    eventName: string,
    properties?: Record<string, any>
  ) {
    const event = {
      timestamp: new Date().toISOString(),
      event: eventName,
      properties,
    };

    if (__DEV__) {
      console.log("📊 Marketplace Event:", event);
    }

    // Store locally for analytics
    this.logEventLocally(event);
  }

  private static async logPerformanceLocally(perfLog: PerformanceLog) {
    try {
      const existingLogs = await AsyncStorage.getItem("performance_logs");
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Keep only last 100 performance logs
      if (logs.length >= 100) {
        logs.shift();
      }

      logs.push(perfLog);
      await AsyncStorage.setItem("performance_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to log performance locally:", error);
    }
  }

  private static async logEventLocally(event: any) {
    try {
      const existingEvents = await AsyncStorage.getItem("analytics_events");
      const events = existingEvents ? JSON.parse(existingEvents) : [];

      // Keep only last 200 events
      if (events.length >= 200) {
        events.shift();
      }

      events.push(event);
      await AsyncStorage.setItem("analytics_events", JSON.stringify(events));
    } catch (error) {
      console.error("Failed to log event locally:", error);
    }
  }

  // FREE method to get stored analytics data
  static async getStoredAnalytics() {
    try {
      const [errorLogs, performanceLogs, analyticsEvents] = await Promise.all([
        AsyncStorage.getItem("error_logs"),
        AsyncStorage.getItem("performance_logs"),
        AsyncStorage.getItem("analytics_events"),
      ]);

      return {
        errors: errorLogs ? JSON.parse(errorLogs) : [],
        performance: performanceLogs ? JSON.parse(performanceLogs) : [],
        events: analyticsEvents ? JSON.parse(analyticsEvents) : [],
      };
    } catch (error) {
      console.error("Failed to retrieve analytics:", error);
      return { errors: [], performance: [], events: [] };
    }
  }

  // FREE method to clear old logs
  static async clearOldLogs() {
    try {
      await Promise.all([
        AsyncStorage.removeItem("error_logs"),
        AsyncStorage.removeItem("performance_logs"),
        AsyncStorage.removeItem("analytics_events"),
      ]);
      console.log("📱 Local analytics logs cleared");
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }
}

// FREE error boundary helper
export const logError = (error: Error, context?: string) => {
  if (__DEV__) {
    console.error(`❌ Error in ${context}:`, error);
  } else {
    logErrorLocally(error, context);
  }
};

// FREE React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logError(error, "error_boundary");
    console.error("Error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 16, textAlign: "center" }}>
        Oops! Something went wrong
      </Text>
      <Text style={{ fontSize: 14, textAlign: "center", marginBottom: 20 }}>
        We're sorry for the inconvenience. Please restart the app.
      </Text>
    </View>
  );
};

export default {
  initializeMonitoring,
  PerformanceTracker,
  logError,
  ErrorBoundary,
};
