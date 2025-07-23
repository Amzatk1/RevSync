import { Platform } from "react-native";

export interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_LOGGING: boolean;
  ENABLE_REDUX_LOGGER: boolean;
  ENVIRONMENT: "development" | "staging" | "production";
}

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:8000/api"; // Android emulator
    } else {
      return "http://localhost:8000/api"; // iOS simulator or development
    }
  } else {
    return "https://api.revsync.com/api"; // Production
  }
};

const config: EnvironmentConfig = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: __DEV__ ? 15000 : 10000,
  ENABLE_LOGGING: __DEV__,
  ENABLE_REDUX_LOGGER: __DEV__,
  ENVIRONMENT: __DEV__ ? "development" : "production",
};

export default config;
