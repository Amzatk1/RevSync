import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import tuneService, { TuneListItem, TuneDetail, TuneFilters } from '../../services/tuneService';

export interface Tune {
  id: string;
  name: string;
  description: string;
  creator: {
    username: string;
    is_verified: boolean;
  };
  price: number;
  is_free: boolean;
  compatibility: string[];
  safety_rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  download_count: number;
  rating_average: number;
  review_count: number;
  file_url?: string;
  image_url?: string;
}

interface TuneState {
  marketplaceTunes: TuneListItem[];
  featuredTunes: TuneListItem[];
  popularTunes: TuneListItem[];
  freeTunes: TuneListItem[];
  purchasedTunes: Tune[];
  selectedTune: TuneDetail | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextPage?: string;
}

const initialState: TuneState = {
  marketplaceTunes: [],
  featuredTunes: [],
  popularTunes: [],
  freeTunes: [],
  purchasedTunes: [],
  selectedTune: null,
  isLoading: false,
  error: null,
  hasMore: true,
  nextPage: undefined,
};

// Async thunks
export const loadMarketplaceTunes = createAsyncThunk(
  'tune/loadMarketplaceTunes',
  async (filters?: TuneFilters) => {
    const response = await tuneService.getTunes(filters);
    return response;
  }
);

export const loadFeaturedTunes = createAsyncThunk(
  'tune/loadFeaturedTunes',
  async () => {
    return await tuneService.getFeaturedTunes();
  }
);

export const loadPopularTunes = createAsyncThunk(
  'tune/loadPopularTunes',
  async () => {
    return await tuneService.getPopularTunes();
  }
);

export const loadFreeTunes = createAsyncThunk(
  'tune/loadFreeTunes',
  async () => {
    return await tuneService.getFreeTunes();
  }
);

export const loadTuneDetail = createAsyncThunk(
  'tune/loadTuneDetail',
  async (tuneId: string) => {
    return await tuneService.getTuneDetail(tuneId);
  }
);

export const loadPurchasedTunes = createAsyncThunk(
  'tune/loadPurchasedTunes',
  async () => {
    // TODO: Implement user's purchased tunes endpoint
    return [];
  }
);

export const purchaseTune = createAsyncThunk(
  'tune/purchaseTune',
  async (tuneId: string) => {
    // TODO: Implement purchase endpoint
    return tuneId;
  }
);

export const tuneSlice = createSlice({
  name: 'tune',
  initialState,
  reducers: {
    selectTune: (state, action: PayloadAction<TuneDetail>) => {
      state.selectedTune = action.payload;
    },
    clearSelectedTune: (state) => {
      state.selectedTune = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTunes: (state) => {
      state.marketplaceTunes = [];
      state.hasMore = true;
      state.nextPage = undefined;
    },
  },
  extraReducers: (builder) => {
    // Load marketplace tunes
    builder.addCase(loadMarketplaceTunes.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadMarketplaceTunes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.marketplaceTunes = action.payload.results;
      state.hasMore = !!action.payload.next;
      state.nextPage = action.payload.next || undefined;
      state.error = null;
    });
    builder.addCase(loadMarketplaceTunes.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load marketplace tunes';
    });

    // Load featured tunes
    builder.addCase(loadFeaturedTunes.fulfilled, (state, action) => {
      state.featuredTunes = action.payload;
    });

    // Load popular tunes
    builder.addCase(loadPopularTunes.fulfilled, (state, action) => {
      state.popularTunes = action.payload;
    });

    // Load free tunes
    builder.addCase(loadFreeTunes.fulfilled, (state, action) => {
      state.freeTunes = action.payload;
    });

    // Load tune detail
    builder.addCase(loadTuneDetail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadTuneDetail.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedTune = action.payload;
      state.error = null;
    });
    builder.addCase(loadTuneDetail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load tune details';
    });

    // Load purchased tunes
    builder.addCase(loadPurchasedTunes.fulfilled, (state, action) => {
      state.purchasedTunes = action.payload;
    });

    // Purchase tune
    builder.addCase(purchaseTune.fulfilled, (state, action) => {
      // TODO: Update purchased tunes list
    });
  },
});

export const { selectTune, clearSelectedTune, clearError, clearTunes } = tuneSlice.actions;
export default tuneSlice.reducer; 