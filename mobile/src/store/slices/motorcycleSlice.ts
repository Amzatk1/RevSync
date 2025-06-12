import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import motorcycleService, { MotorcycleListItem, MotorcycleDetail, MotorcycleFilters } from '../../services/motorcycleService';

export interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url?: string;
  ecu_type: string;
  connection_protocol: string;
  last_flash_date?: string;
  current_tune: string;
  connection_status: 'connected' | 'disconnected' | 'never_connected';
  battery_level?: number;
  last_connected?: string;
}

interface MotorcycleState {
  motorcycles: MotorcycleListItem[];
  userMotorcycles: Motorcycle[];
  selectedMotorcycle: MotorcycleDetail | null;
  popularMotorcycles: MotorcycleListItem[];
  newMotorcycles: MotorcycleListItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextPage?: string;
}

const initialState: MotorcycleState = {
  motorcycles: [],
  userMotorcycles: [],
  selectedMotorcycle: null,
  popularMotorcycles: [],
  newMotorcycles: [],
  isLoading: false,
  error: null,
  hasMore: true,
  nextPage: undefined,
};

// Async thunks
export const loadMotorcycles = createAsyncThunk(
  'motorcycle/loadMotorcycles',
  async (filters?: MotorcycleFilters) => {
    const response = await motorcycleService.getMotorcycles(filters);
    return response;
  }
);

export const loadMotorcycleDetail = createAsyncThunk(
  'motorcycle/loadMotorcycleDetail',
  async (motorcycleId: number) => {
    return await motorcycleService.getMotorcycleDetail(motorcycleId);
  }
);

export const loadPopularMotorcycles = createAsyncThunk(
  'motorcycle/loadPopularMotorcycles',
  async () => {
    return await motorcycleService.getPopularMotorcycles();
  }
);

export const loadNewMotorcycles = createAsyncThunk(
  'motorcycle/loadNewMotorcycles',
  async () => {
    return await motorcycleService.getNewMotorcycles();
  }
);

export const loadUserMotorcycles = createAsyncThunk(
  'motorcycle/loadUserMotorcycles',
  async () => {
    // Return mock data for now - this would come from user's garage
    return [
      {
        id: '1',
        make: 'Yamaha',
        model: 'R6',
        year: 2020,
        ecu_type: 'Bosch ME17',
        connection_protocol: 'CAN-H/L',
        current_tune: 'Stage 2 Performance',
        connection_status: 'connected' as const,
        battery_level: 85,
        last_connected: '2024-01-22T10:30:00Z',
      },
    ];
  }
);

export const addMotorcycle = createAsyncThunk(
  'motorcycle/addMotorcycle',
  async (motorcycleData: Omit<Motorcycle, 'id'>) => {
    // API call would go here
    return {
      ...motorcycleData,
      id: Date.now().toString(),
    };
  }
);

export const updateMotorcycle = createAsyncThunk(
  'motorcycle/updateMotorcycle',
  async ({ id, updates }: { id: string; updates: Partial<Motorcycle> }) => {
    // API call would go here
    return { id, updates };
  }
);

export const motorcycleSlice = createSlice({
  name: 'motorcycle',
  initialState,
  reducers: {
    selectMotorcycle: (state, action: PayloadAction<MotorcycleDetail>) => {
      state.selectedMotorcycle = action.payload;
    },
    clearSelectedMotorcycle: (state) => {
      state.selectedMotorcycle = null;
    },
    updateConnectionStatus: (
      state,
      action: PayloadAction<{ id: string; status: Motorcycle['connection_status'] }>
    ) => {
      const motorcycle = state.userMotorcycles.find(m => m.id === action.payload.id);
      if (motorcycle) {
        motorcycle.connection_status = action.payload.status;
        motorcycle.last_connected = new Date().toISOString();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMotorcycles: (state) => {
      state.motorcycles = [];
      state.hasMore = true;
      state.nextPage = undefined;
    },
  },
  extraReducers: (builder) => {
    // Load motorcycles
    builder.addCase(loadMotorcycles.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadMotorcycles.fulfilled, (state, action) => {
      state.isLoading = false;
      state.motorcycles = action.payload.results;
      state.hasMore = !!action.payload.next;
      state.nextPage = action.payload.next || undefined;
      state.error = null;
    });
    builder.addCase(loadMotorcycles.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load motorcycles';
    });

    // Load motorcycle detail
    builder.addCase(loadMotorcycleDetail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadMotorcycleDetail.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedMotorcycle = action.payload;
      state.error = null;
    });
    builder.addCase(loadMotorcycleDetail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load motorcycle details';
    });

    // Load popular motorcycles
    builder.addCase(loadPopularMotorcycles.fulfilled, (state, action) => {
      state.popularMotorcycles = action.payload;
    });

    // Load new motorcycles
    builder.addCase(loadNewMotorcycles.fulfilled, (state, action) => {
      state.newMotorcycles = action.payload;
    });

    // Load user motorcycles
    builder.addCase(loadUserMotorcycles.fulfilled, (state, action) => {
      state.userMotorcycles = action.payload;
    });

    // Add motorcycle
    builder.addCase(addMotorcycle.fulfilled, (state, action) => {
      state.userMotorcycles.push(action.payload);
    });

    // Update motorcycle
    builder.addCase(updateMotorcycle.fulfilled, (state, action) => {
      const index = state.userMotorcycles.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.userMotorcycles[index] = { ...state.userMotorcycles[index], ...action.payload.updates };
      }
    });
  },
});

export const { 
  selectMotorcycle, 
  clearSelectedMotorcycle, 
  updateConnectionStatus, 
  clearError,
  clearMotorcycles
} = motorcycleSlice.actions;

export default motorcycleSlice.reducer; 