// Temporary OpenAPI types for AI endpoints.
// Can be replaced by generated types via openapi-typescript.

declare namespace API {
  export interface BikeSnapshot {
    id?: number;
    manufacturer?: string;
    model_name?: string;
    year?: number;
    displacement_cc?: number;
  }

  export interface AITuneRequestInput {
    preferences: Record<string, any>;
    bike?: BikeSnapshot;
  }

  export interface AITuneRequestHistoryItem {
    id: number;
    bike_id?: number | null;
    bike_snapshot: BikeSnapshot | Record<string, any>;
    preferences: Record<string, any>;
    recommendation_ids: number[];
    created_at: string;
  }

  export interface AITuneHistoryResponse {
    results: AITuneRequestHistoryItem[];
  }

  export interface AITuneItem {
    id: number | string;
    name: string;
    category?: { name?: string } | string;
    ai_explanation?: string;
    ai_analysis?: { safety_level?: string };
    safety_level?: string;
  }

  export interface AITuneRequestResponse {
    message: string;
    tunes: AITuneItem[];
    saved: boolean;
  }
}


