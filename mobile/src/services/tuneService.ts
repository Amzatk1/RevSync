import apiClient from "./api";
import { MotorcycleListItem } from "./motorcycleService";

export interface TuneCategory {
  name: string;
  description: string;
  color_code: string;
  icon_name: string;
}

export interface TuneType {
  name: string;
  description: string;
  skill_level_required: string;
  reversible: boolean;
}

export interface SafetyRating {
  level: string;
  description: string;
  color_code: string;
  warning_text: string;
}

export interface TuneCreator {
  id: number;
  username: string;
  email: string;
  business_name?: string;
  bio?: string;
  specialties: string[];
  experience_years: number;
  is_verified: boolean;
  verification_level: string;
  website?: string;
  total_tunes: number;
  total_downloads: number;
  average_rating: number;
}

export interface TuneCompatibility {
  motorcycle: MotorcycleListItem;
  is_verified: boolean;
  testing_status: string;
  installation_notes?: string;
  compatibility_notes?: string;
}

export interface TuneListItem {
  id: string;
  name: string;
  version: string;
  short_description: string;
  creator: TuneCreator;
  category: TuneCategory;
  tune_type: TuneType;
  safety_rating: SafetyRating;
  power_gain_hp?: number;
  power_gain_percentage?: number;
  fuel_economy_change_percentage?: number;
  price: number;
  is_open_source: boolean;
  dyno_tested: boolean;
  street_legal: boolean;
  download_count: number;
  average_rating: number;
  tags: string[];
  published_at: string;
  is_featured: boolean;
}

export interface TuneDetail extends TuneListItem {
  description: string;
  torque_gain_nm?: number;
  torque_gain_percentage?: number;
  is_track_only: boolean;
  requires_premium_fuel: boolean;
  view_count: number;
  installation_instructions?: string;
  compatible_motorcycles: TuneCompatibility[];
}

export interface TuneReview {
  id: number;
  username: string;
  motorcycle_name: string;
  overall_rating: number;
  performance_rating: number;
  installation_ease: number;
  value_for_money: number;
  title: string;
  review_text: string;
  pros?: string;
  cons?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface TuneStats {
  total_tunes: number;
  free_tunes: number;
  verified_creators: number;
  total_downloads: number;
  categories: number;
}

export interface TuneFilters {
  category?: string;
  tune_type?: string;
  safety_rating?: string;
  price_min?: number;
  price_max?: number;
  pricing?: "free" | "paid";
  is_open_source?: boolean;
  dyno_tested?: boolean;
  street_legal?: boolean;
  is_track_only?: boolean;
  is_featured?: boolean;
  motorcycle?: number;
  search?: string;
  ordering?: string;
}

class TuneService {
  // Get all categories
  async getCategories(): Promise<TuneCategory[]> {
    const response = await apiClient.get("/tunes/categories/");
    return response.data;
  }

  // Get all tune types
  async getTuneTypes(): Promise<TuneType[]> {
    const response = await apiClient.get("/tunes/types/");
    return response.data;
  }

  // Get all safety ratings
  async getSafetyRatings(): Promise<SafetyRating[]> {
    const response = await apiClient.get("/tunes/safety-ratings/");
    return response.data;
  }

  // Get all creators
  async getCreators(): Promise<TuneCreator[]> {
    const response = await apiClient.get("/tunes/creators/");
    return response.data;
  }

  // Get creator details
  async getCreatorDetail(id: number): Promise<TuneCreator> {
    const response = await apiClient.get(`/tunes/creators/${id}/`);
    return response.data;
  }

  // Get tunes with filters
  async getTunes(filters?: TuneFilters): Promise<{
    results: TuneListItem[];
    count: number;
    next?: string;
    previous?: string;
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/tunes/tunes/?${params.toString()}`);
    return response.data;
  }

  // Get tune details
  async getTuneDetail(id: string): Promise<TuneDetail> {
    const response = await apiClient.get(`/tunes/tunes/${id}/`);
    return response.data;
  }

  // Get tune reviews
  async getTuneReviews(tuneId: string): Promise<TuneReview[]> {
    const response = await apiClient.get(`/tunes/tunes/${tuneId}/reviews/`);
    return response.data;
  }

  // Get featured tunes
  async getFeaturedTunes(): Promise<TuneListItem[]> {
    const response = await apiClient.get("/tunes/tunes/featured/");
    return response.data;
  }

  // Get popular tunes
  async getPopularTunes(): Promise<TuneListItem[]> {
    const response = await apiClient.get("/tunes/tunes/popular/");
    return response.data;
  }

  // Get recent tunes
  async getRecentTunes(): Promise<TuneListItem[]> {
    const response = await apiClient.get("/tunes/tunes/recent/");
    return response.data;
  }

  // Get free tunes
  async getFreeTunes(): Promise<TuneListItem[]> {
    const response = await apiClient.get("/tunes/tunes/free/");
    return response.data;
  }

  // Get platform statistics
  async getTuneStats(): Promise<TuneStats> {
    const response = await apiClient.get("/tunes/stats/");
    return response.data;
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await apiClient.get(
      `/tunes/search/suggestions/?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }
}

export default new TuneService();
