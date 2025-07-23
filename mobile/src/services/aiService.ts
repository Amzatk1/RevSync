import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./api";
import { PerformanceTracker, logError } from "../config/monitoring";

export interface OnboardingData {
  motorcycleType: string;
  skillLevel: string;
  ridingStyle: string[];
  goals: string[];
  experience: string;
}

export interface UserProfile {
  motorcycleType: string;
  skillLevel: string;
  ridingStyle: string[];
  goals: string[];
  experience: string;
  aiRiderType: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIRecommendation {
  id: string;
  name: string;
  description: string;
  creator: {
    username: string;
    is_verified: boolean;
  };
  category: {
    name: string;
  };
  safety_rating: {
    level: string;
  };
  average_rating: number;
  download_count: number;
  is_open_source: boolean;
  // AI-specific fields
  ai_match_score: number;
  ai_explanation: string;
  ai_safety_assessment: string;
  ai_expected_benefits: string[];
  ai_recommendation_reason: string;
}

export interface RecommendationResponse {
  recommendations: AIRecommendation[];
  user_profile: {
    motorcycle_type: string;
    skill_level: string;
    ai_rider_type: string;
  };
  recommendation_metadata: {
    type: string;
    generated_at: string;
    algorithm: string;
  };
}

export interface UserInsights {
  user_profile: UserProfile;
  interaction_stats: {
    total_interactions: number;
    total_downloads: number;
    total_recommendations: number;
    clicked_recommendations: number;
    click_through_rate: number;
  };
  preferences: {
    top_categories: Array<{ tune__category__name: string; count: number }>;
    ai_safety_profile: Record<string, any>;
  };
  generated_at: string;
}

class AIService {
  private static readonly CACHE_KEYS = {
    USER_PROFILE: "ai_user_profile",
    RECOMMENDATIONS: "ai_recommendations",
    LAST_SYNC: "ai_last_sync",
  };

  // 🚀 Complete user onboarding
  static async completeOnboarding(data: OnboardingData): Promise<{
    message: string;
    profile_id: number;
    ai_rider_type: string;
    recommendations_ready: boolean;
  }> {
    try {
      PerformanceTracker.startTransaction(
        "ai_onboarding",
        "Completing AI onboarding"
      );

      const response = await apiClient.post("/ai/onboarding/", data);

      // 💾 Cache user profile locally
      await AsyncStorage.setItem(
        this.CACHE_KEYS.USER_PROFILE,
        JSON.stringify({
          ...data,
          ai_rider_type: response.data.ai_rider_type,
          completed_at: new Date().toISOString(),
        })
      );

      PerformanceTracker.trackMarketplaceEvent("ai_onboarding_completed", {
        ai_rider_type: response.data.ai_rider_type,
        motorcycle_type: data.motorcycleType,
        skill_level: data.skillLevel,
      });

      PerformanceTracker.finishTransaction("ai_onboarding");

      return response.data;
    } catch (error) {
      logError(error as Error, "ai_onboarding");
      throw new Error("Failed to complete onboarding. Please try again.");
    }
  }

  // 👤 Get user profile
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      // Try local cache first
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      if (cached) {
        const profile = JSON.parse(cached);
        // Return cached if less than 1 hour old
        const cacheAge =
          Date.now() - new Date(profile.completed_at || 0).getTime();
        if (cacheAge < 3600000) {
          // 1 hour
          return profile;
        }
      }

      // Fetch from backend
      const response = await apiClient.get("/ai/onboarding/");

      // Update cache
      await AsyncStorage.setItem(
        this.CACHE_KEYS.USER_PROFILE,
        JSON.stringify({
          ...response.data,
          cached_at: new Date().toISOString(),
        })
      );

      return response.data;
    } catch (error) {
      logError(error as Error, "get_user_profile");

      // Return cached profile if available
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      return cached ? JSON.parse(cached) : null;
    }
  }

  // 🎯 Get AI recommendations
  static async getRecommendations(
    type: "personalized" | "trending" | "similar" = "personalized",
    limit: number = 10,
    forceRefresh: boolean = false
  ): Promise<RecommendationResponse> {
    try {
      PerformanceTracker.startTransaction(
        "ai_recommendations",
        `Getting ${type} recommendations`
      );

      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cached = await this.getCachedRecommendations(type);
        if (cached) {
          PerformanceTracker.finishTransaction("ai_recommendations");
          return cached;
        }
      }

      const response = await apiClient.get("/ai/recommendations/", {
        params: {
          type,
          limit,
          refresh: forceRefresh.toString(),
        },
      });

      // Cache recommendations
      await this.cacheRecommendations(type, response.data);

      PerformanceTracker.trackMarketplaceEvent("ai_recommendations_received", {
        type,
        count: response.data.recommendations.length,
        algorithm: response.data.recommendation_metadata.algorithm,
      });

      PerformanceTracker.finishTransaction("ai_recommendations");

      return response.data;
    } catch (error) {
      logError(error as Error, "ai_recommendations");

      // Try to return cached recommendations
      const cached = await this.getCachedRecommendations(type);
      if (cached) {
        return cached;
      }

      throw new Error("Failed to get recommendations. Please try again.");
    }
  }

  // 📊 Track user interaction
  static async trackInteraction(
    interactionType: "view" | "click" | "download" | "like" | "dislike",
    tuneId: string,
    recommendationId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await apiClient.post("/ai/track-interaction/", {
        interaction_type: interactionType,
        tune_id: tuneId,
        recommendation_id: recommendationId,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          platform: "mobile",
        },
      });

      PerformanceTracker.trackMarketplaceEvent("ai_interaction_tracked", {
        interaction_type: interactionType,
        tune_id: tuneId,
        was_recommended: !!recommendationId,
      });
    } catch (error) {
      logError(error as Error, "track_interaction");
      // Don't throw error for tracking failures
      console.warn("Failed to track interaction:", error);
    }
  }

  // 🧠 Get user insights
  static async getUserInsights(): Promise<UserInsights> {
    try {
      const response = await apiClient.get("/ai/user-insights/");

      PerformanceTracker.trackMarketplaceEvent("ai_insights_viewed");

      return response.data;
    } catch (error) {
      logError(error as Error, "get_user_insights");
      throw new Error("Failed to get user insights.");
    }
  }

  // 💾 Cache management
  private static async getCachedRecommendations(
    type: string
  ): Promise<RecommendationResponse | null> {
    try {
      const cached = await AsyncStorage.getItem(
        `${this.CACHE_KEYS.RECOMMENDATIONS}_${type}`
      );
      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);

      // Check if cache is fresh (less than 1 hour old)
      const cacheAge = Date.now() - new Date(data.cached_at).getTime();
      if (cacheAge > 3600000) {
        // 1 hour
        return null;
      }

      return data.recommendations;
    } catch {
      return null;
    }
  }

  private static async cacheRecommendations(
    type: string,
    data: RecommendationResponse
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.CACHE_KEYS.RECOMMENDATIONS}_${type}`,
        JSON.stringify({
          recommendations: data,
          cached_at: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn("Failed to cache recommendations:", error);
    }
  }

  // 🗑️ Clear all AI data (for logout)
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.CACHE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(
          `${this.CACHE_KEYS.RECOMMENDATIONS}_personalized`
        ),
        AsyncStorage.removeItem(`${this.CACHE_KEYS.RECOMMENDATIONS}_trending`),
        AsyncStorage.removeItem(`${this.CACHE_KEYS.RECOMMENDATIONS}_similar`),
        AsyncStorage.removeItem(this.CACHE_KEYS.LAST_SYNC),
      ]);
    } catch (error) {
      console.warn("Failed to clear AI data:", error);
    }
  }

  // ✅ Check if user has completed onboarding
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return !!profile;
    } catch {
      return false;
    }
  }

  // 🔄 Sync with backend (for offline support)
  static async syncWithBackend(): Promise<void> {
    try {
      const lastSync = await AsyncStorage.getItem(this.CACHE_KEYS.LAST_SYNC);
      const now = Date.now();

      // Only sync if last sync was more than 5 minutes ago
      if (lastSync && now - parseInt(lastSync) < 300000) {
        return;
      }

      // Force refresh recommendations
      await this.getRecommendations("personalized", 10, true);

      // Update sync timestamp
      await AsyncStorage.setItem(this.CACHE_KEYS.LAST_SYNC, now.toString());
    } catch (error) {
      console.warn("Failed to sync with backend:", error);
    }
  }
}

export default AIService;
