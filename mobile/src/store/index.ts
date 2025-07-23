import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authSlice } from "./slices/authSlice";
import { motorcycleSlice } from "./slices/motorcycleSlice";
import { tuneSlice } from "./slices/tuneSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "motorcycle"], // Only persist auth and motorcycle data
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  motorcycle: motorcycleSlice.reducer,
  tune: tuneSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
