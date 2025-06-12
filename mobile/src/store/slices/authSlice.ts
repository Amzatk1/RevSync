import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_creator: boolean;
  creator_verified: boolean;
  subscription_type: 'free' | 'premium' | 'creator';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// Async thunks for auth actions
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    // API call would go here
    // For now, return mock data
    return {
      user: {
        id: '1',
        username: 'RiderTech',
        email: credentials.email,
        is_creator: false,
        creator_verified: false,
        subscription_type: 'premium' as const,
      },
      token: 'mock-jwt-token',
    };
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string }) => {
    // API call would go here
    return {
      user: {
        id: '1',
        username: userData.username,
        email: userData.email,
        is_creator: false,
        creator_verified: false,
        subscription_type: 'free' as const,
      },
      token: 'mock-jwt-token',
    };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  // Clear any stored tokens, etc.
  return null;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Login failed';
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Registration failed';
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer; 