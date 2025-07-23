import AsyncStorage from "@react-native-async-storage/async-storage";
import { TuneListItem } from "./tuneService";
import { PerformanceTracker } from "../config/monitoring";

interface UserInteraction {
  tuneId: string;
  action: "view" | "download" | "like" | "share";
  timestamp: number;
  tuneName: string;
  category: string;
  creator: string;
}

interface RecommendationScore {
  tuneId: string;
  score: number;
  reasons: string[];
}

export class FreeRecommendationService {
  private static readonly STORAGE_KEYS = {
    USER_INTERACTIONS: "user_interactions",
    VIEWED_TUNES: "viewed_tunes",
    LIKED_CATEGORIES: "liked_categories",
    FAVORITE_CREATORS: "favorite_creators",
  };

  // 🆓 Track user interactions (FREE using AsyncStorage)
  static async trackInteraction(
    tuneId: string,
    action: "view" | "download" | "like" | "share",
    tune: TuneListItem
  ): Promise<void> {
    try {
      const interaction: UserInteraction = {
        tuneId,
        action,
        timestamp: Date.now(),
        tuneName: tune.name,
        category: tune.category.name,
        creator: tune.creator.username,
      };

      const existing = await AsyncStorage.getItem(
        this.STORAGE_KEYS.USER_INTERACTIONS
      );
      const interactions: UserInteraction[] = existing
        ? JSON.parse(existing)
        : [];

      // Keep only last 200 interactions to avoid storage bloat
      if (interactions.length >= 200) {
        interactions.shift();
      }

      interactions.push(interaction);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_INTERACTIONS,
        JSON.stringify(interactions)
      );

      // Update category preferences
      await this.updateCategoryPreferences(tune.category.name, action);

      PerformanceTracker.trackMarketplaceEvent("interaction_tracked", {
        action,
        tuneId,
        category: tune.category.name,
      });
    } catch (error) {
      console.error("Failed to track interaction:", error);
    }
  }

  // 🆓 Get personalized recommendations (FREE algorithms)
  static async getRecommendations(
    allTunes: TuneListItem[],
    limit: number = 10
  ): Promise<TuneListItem[]> {
    try {
      const scores = await this.calculateRecommendationScores(allTunes);

      // Sort by score and return top recommendations
      const sortedScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const recommendedTunes = sortedScores
        .map((score) => allTunes.find((tune) => tune.id === score.tuneId))
        .filter((tune) => tune !== undefined) as TuneListItem[];

      PerformanceTracker.trackMarketplaceEvent("recommendations_generated", {
        count: recommendedTunes.length,
        algorithm: "hybrid_free",
      });

      return recommendedTunes;
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      // Fallback: return popular tunes
      return this.getPopularTunes(allTunes, limit);
    }
  }

  // 🆓 Calculate recommendation scores (FREE hybrid algorithm)
  private static async calculateRecommendationScores(
    allTunes: TuneListItem[]
  ): Promise<RecommendationScore[]> {
    const [interactions, categoryPrefs, viewedTunes] = await Promise.all([
      this.getUserInteractions(),
      this.getCategoryPreferences(),
      this.getViewedTunes(),
    ]);

    return allTunes.map((tune) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. 🆓 Popularity score (40% weight)
      const popularityScore =
        (tune.download_count || 0) * 0.001 + (tune.average_rating || 0) * 10;
      score += popularityScore * 0.4;
      if (tune.download_count > 100) {
        reasons.push("Popular");
      }

      // 2. 🆓 Category preference score (30% weight)
      const categoryPref = categoryPrefs[tune.category.name] || 0;
      score += categoryPref * 0.3;
      if (categoryPref > 0.5) {
        reasons.push("Matches your interests");
      }

      // 3. 🆓 Creator familiarity score (15% weight)
      const creatorInteractions = interactions.filter(
        (i) => i.creator === tune.creator.username
      ).length;
      const creatorScore = Math.min(creatorInteractions * 0.2, 1.0);
      score += creatorScore * 0.15;
      if (creatorInteractions > 2) {
        reasons.push("Familiar creator");
      }

      // 4. 🆓 Freshness score (10% weight)
      const daysSincePublished =
        (Date.now() - new Date(tune.published_at).getTime()) /
        (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 1 - daysSincePublished / 30); // Prefer tunes published within 30 days
      score += freshnessScore * 0.1;
      if (daysSincePublished < 7) {
        reasons.push("Recently published");
      }

      // 5. 🆓 Safety score (5% weight)
      const safetyScore =
        tune.safety_rating.level === "SAFE"
          ? 1.0
          : tune.safety_rating.level === "MODERATE"
          ? 0.7
          : 0.4;
      score += safetyScore * 0.05;
      if (tune.safety_rating.level === "SAFE") {
        reasons.push("Safe rating");
      }

      // 🆓 Penalty for already viewed tunes
      if (viewedTunes.includes(tune.id)) {
        score *= 0.7; // Reduce score by 30%
      }

      return {
        tuneId: tune.id,
        score: Math.round(score * 100) / 100,
        reasons,
      };
    });
  }

  // 🆓 Get popular tunes (FREE fallback)
  static getPopularTunes(
    allTunes: TuneListItem[],
    limit: number = 10
  ): TuneListItem[] {
    return [...allTunes]
      .sort((a, b) => {
        // Sort by download count * average rating
        const scoreA = (a.download_count || 0) * (a.average_rating || 0);
        const scoreB = (b.download_count || 0) * (b.average_rating || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // 🆓 Get trending tunes (FREE algorithm)
  static getTrendingTunes(
    allTunes: TuneListItem[],
    limit: number = 10
  ): TuneListItem[] {
    const now = Date.now();

    return [...allTunes]
      .sort((a, b) => {
        // Calculate trend score based on recency and popularity
        const daysA =
          (now - new Date(a.published_at).getTime()) / (1000 * 60 * 60 * 24);
        const daysB =
          (now - new Date(b.published_at).getTime()) / (1000 * 60 * 60 * 24);

        // Trending score: downloads per day since published
        const scoreA = (a.download_count || 0) / Math.max(daysA, 1);
        const scoreB = (b.download_count || 0) / Math.max(daysB, 1);

        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // 🆓 Get similar tunes (FREE content-based filtering)
  static async getSimilarTunes(
    targetTune: TuneListItem,
    allTunes: TuneListItem[],
    limit: number = 5
  ): Promise<TuneListItem[]> {
    const similarities = allTunes
      .filter((tune) => tune.id !== targetTune.id)
      .map((tune) => ({
        tune,
        similarity: this.calculateSimilarity(targetTune, tune),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map((s) => s.tune);
  }

  // 🆓 Calculate tune similarity (FREE algorithm)
  private static calculateSimilarity(
    tune1: TuneListItem,
    tune2: TuneListItem
  ): number {
    let similarity = 0;

    // Same category: +40%
    if (tune1.category.name === tune2.category.name) {
      similarity += 0.4;
    }

    // Same creator: +30%
    if (tune1.creator.username === tune2.creator.username) {
      similarity += 0.3;
    }

    // Similar safety rating: +20%
    if (tune1.safety_rating.level === tune2.safety_rating.level) {
      similarity += 0.2;
    }

    // Both free or both paid: +10%
    if (tune1.is_open_source === tune2.is_open_source) {
      similarity += 0.1;
    }

    return similarity;
  }

  // 🆓 Helper methods (FREE AsyncStorage operations)
  private static async getUserInteractions(): Promise<UserInteraction[]> {
    try {
      const data = await AsyncStorage.getItem(
        this.STORAGE_KEYS.USER_INTERACTIONS
      );
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static async getCategoryPreferences(): Promise<
    Record<string, number>
  > {
    try {
      const data = await AsyncStorage.getItem(
        this.STORAGE_KEYS.LIKED_CATEGORIES
      );
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static async getViewedTunes(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.VIEWED_TUNES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static async updateCategoryPreferences(
    category: string,
    action: string
  ): Promise<void> {
    try {
      const prefs = await this.getCategoryPreferences();
      const weight =
        action === "download" ? 0.3 : action === "like" ? 0.2 : 0.1;

      prefs[category] = (prefs[category] || 0) + weight;

      // Normalize to 0-1 range
      const maxPref = Math.max(...Object.values(prefs));
      if (maxPref > 1) {
        Object.keys(prefs).forEach((key) => {
          prefs[key] /= maxPref;
        });
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LIKED_CATEGORIES,
        JSON.stringify(prefs)
      );
    } catch (error) {
      console.error("Failed to update category preferences:", error);
    }
  }

  // 🆓 Get recommendation stats (FREE analytics)
  static async getRecommendationStats(): Promise<{
    totalInteractions: number;
    topCategories: Array<{ category: string; score: number }>;
    recentActivity: UserInteraction[];
  }> {
    try {
      const [interactions, categoryPrefs] = await Promise.all([
        this.getUserInteractions(),
        this.getCategoryPreferences(),
      ]);

      const topCategories = Object.entries(categoryPrefs)
        .map(([category, score]) => ({ category, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const recentActivity = interactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      return {
        totalInteractions: interactions.length,
        topCategories,
        recentActivity,
      };
    } catch (error) {
      console.error("Failed to get recommendation stats:", error);
      return {
        totalInteractions: 0,
        topCategories: [],
        recentActivity: [],
      };
    }
  }

  // 🆓 Clear recommendation data (for testing)
  static async clearRecommendationData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER_INTERACTIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.VIEWED_TUNES),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LIKED_CATEGORIES),
        AsyncStorage.removeItem(this.STORAGE_KEYS.FAVORITE_CREATORS),
      ]);
      console.log("Recommendation data cleared successfully");
    } catch (error) {
      console.error("Error clearing recommendation data:", error);
    }
  }
}

export default FreeRecommendationService;
