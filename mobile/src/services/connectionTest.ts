import apiClient from "./api";
import config from "../config/environment";

export interface ConnectionTestResult {
  isConnected: boolean;
  responseTime: number;
  error?: string;
  backendInfo?: {
    total_motorcycles: number;
    manufacturers: number;
    categories: number;
    latest_year: number;
  };
}

export class ConnectionTest {
  /**
   * Test connection to the backend API
   */
  static async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      console.log(`🔗 Testing connection to: ${config.API_BASE_URL}`);

      const response = await apiClient.get("/bikes/stats/");
      const responseTime = Date.now() - startTime;

      return {
        isConnected: true,
        responseTime,
        backendInfo: response.data,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        isConnected: false,
        responseTime,
        error: error.message || "Connection failed",
      };
    }
  }

  /**
   * Test authentication endpoint
   */
  static async testAuth(): Promise<boolean> {
    try {
      // This endpoint would need to be implemented in the backend
      await apiClient.get("/auth/test/");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test basic API endpoints
   */
  static async testEndpoints(): Promise<Record<string, boolean>> {
    const endpoints = [
      "/bikes/manufacturers/",
      "/bikes/categories/",
      "/bikes/engine-types/",
      "/bikes/motorcycles/",
      "/tunes/categories/",
      "/tunes/types/",
    ];

    const results: Record<string, boolean> = {};

    for (const endpoint of endpoints) {
      try {
        await apiClient.get(endpoint);
        results[endpoint] = true;
      } catch (error) {
        results[endpoint] = false;
      }
    }

    return results;
  }
}

export default ConnectionTest;
