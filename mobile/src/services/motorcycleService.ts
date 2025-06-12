import apiClient from './api';

export interface Manufacturer {
  id: number;
  name: string;
  country: string;
  founded_year?: number;
  logo_url?: string;
  website?: string;
}

export interface BikeCategory {
  id: number;
  name: string;
  description: string;
  typical_use?: string;
}

export interface EngineType {
  id: number;
  name: string;
  description: string;
  typical_displacement_range?: string;
}

export interface MotorcycleListItem {
  id: number;
  manufacturer: Manufacturer;
  model_name: string;
  year: number;
  category: BikeCategory;
  engine_type: EngineType;
  displacement_cc: number;
  cylinders: number;
  max_power_hp?: number;
  max_torque_nm?: number;
  dry_weight_kg?: number;
  msrp_usd?: number;
  image_url?: string;
}

export interface MotorcycleDetail extends MotorcycleListItem {
  seat_height_mm?: number;
  fuel_capacity_liters?: number;
  top_speed_kmh?: number;
  abs: boolean;
  traction_control: boolean;
  riding_modes: boolean;
  quickshifter: boolean;
  cruise_control: boolean;
  heated_grips: boolean;
  description?: string;
  created_at: string;
}

export interface MotorcycleStats {
  total_motorcycles: number;
  manufacturers: number;
  categories: number;
  latest_year: number;
  displacement_range: {
    min: number;
    max: number;
  };
}

export interface MotorcycleFilters {
  manufacturer?: string;
  category?: string;
  engine_type?: string;
  year_min?: number;
  year_max?: number;
  displacement_min?: number;
  displacement_max?: number;
  price_min?: number;
  price_max?: number;
  search?: string;
  ordering?: string;
}

class MotorcycleService {
  // Get all manufacturers
  async getManufacturers(): Promise<Manufacturer[]> {
    const response = await apiClient.get('/bikes/manufacturers/');
    return response.data;
  }

  // Get all categories
  async getCategories(): Promise<BikeCategory[]> {
    const response = await apiClient.get('/bikes/categories/');
    return response.data;
  }

  // Get all engine types
  async getEngineTypes(): Promise<EngineType[]> {
    const response = await apiClient.get('/bikes/engine-types/');
    return response.data;
  }

  // Get motorcycles with filters
  async getMotorcycles(filters?: MotorcycleFilters): Promise<{
    results: MotorcycleListItem[];
    count: number;
    next?: string;
    previous?: string;
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/bikes/motorcycles/?${params.toString()}`);
    return response.data;
  }

  // Get motorcycle details
  async getMotorcycleDetail(id: number): Promise<MotorcycleDetail> {
    const response = await apiClient.get(`/bikes/motorcycles/${id}/`);
    return response.data;
  }

  // Get motorcycles by manufacturer
  async getMotorcyclesByManufacturer(manufacturerId: number): Promise<MotorcycleListItem[]> {
    const response = await apiClient.get(`/bikes/manufacturers/${manufacturerId}/motorcycles/`);
    return response.data;
  }

  // Get popular motorcycles
  async getPopularMotorcycles(): Promise<MotorcycleListItem[]> {
    const response = await apiClient.get('/bikes/motorcycles/popular/');
    return response.data;
  }

  // Get new motorcycles
  async getNewMotorcycles(): Promise<MotorcycleListItem[]> {
    const response = await apiClient.get('/bikes/motorcycles/new/');
    return response.data;
  }

  // Get motorcycle statistics
  async getMotorcycleStats(): Promise<MotorcycleStats> {
    const response = await apiClient.get('/bikes/stats/');
    return response.data;
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await apiClient.get(`/bikes/search/suggestions/?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export default new MotorcycleService(); 