import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TelemetryData {
  rpm: number;
  speed: number;
  throttle: number;
  afr: number;
  egt: number;
  boost: number;
  oilTemp: number;
  waterTemp: number;
  batteryVoltage: number;
  gear: number;
  timestamp: number;
}

interface TelemetryState {
  isConnected: boolean;
  isRecording: boolean;
  currentData: TelemetryData | null;
  sessionData: TelemetryData[];
  recordingSessions: {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    data: TelemetryData[];
  }[];
  connectionStatus: {
    deviceName: string;
    protocol: string;
    signalStrength: number;
    lastDataReceived: number;
  } | null;
}

const initialState: TelemetryState = {
  isConnected: false,
  isRecording: false,
  currentData: null,
  sessionData: [],
  recordingSessions: [],
  connectionStatus: null,
};

export const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<{
      isConnected: boolean;
      deviceName?: string;
      protocol?: string;
      signalStrength?: number;
    }>) => {
      state.isConnected = action.payload.isConnected;
      if (action.payload.isConnected && action.payload.deviceName) {
        state.connectionStatus = {
          deviceName: action.payload.deviceName,
          protocol: action.payload.protocol || 'Unknown',
          signalStrength: action.payload.signalStrength || 0,
          lastDataReceived: Date.now(),
        };
      } else {
        state.connectionStatus = null;
      }
    },

    updateTelemetryData: (state, action: PayloadAction<TelemetryData>) => {
      state.currentData = action.payload;
      if (state.connectionStatus) {
        state.connectionStatus.lastDataReceived = Date.now();
      }
      
      // Add to session data if recording
      if (state.isRecording) {
        state.sessionData.push(action.payload);
      }
    },

    startRecording: (state, action: PayloadAction<{ sessionName?: string }>) => {
      state.isRecording = true;
      state.sessionData = [];
      
      // Create new recording session
      const sessionId = Date.now().toString();
      state.recordingSessions.push({
        id: sessionId,
        name: action.payload.sessionName || `Session ${sessionId}`,
        startTime: Date.now(),
        data: [],
      });
    },

    stopRecording: (state) => {
      state.isRecording = false;
      
      // Update the current session with end time and data
      const currentSession = state.recordingSessions[state.recordingSessions.length - 1];
      if (currentSession) {
        currentSession.endTime = Date.now();
        currentSession.data = [...state.sessionData];
      }
      
      state.sessionData = [];
    },

    deleteSession: (state, action: PayloadAction<string>) => {
      state.recordingSessions = state.recordingSessions.filter(
        session => session.id !== action.payload
      );
    },

    clearCurrentData: (state) => {
      state.currentData = null;
    },

    updateSignalStrength: (state, action: PayloadAction<number>) => {
      if (state.connectionStatus) {
        state.connectionStatus.signalStrength = action.payload;
      }
    },
  },
});

export const {
  setConnectionStatus,
  updateTelemetryData,
  startRecording,
  stopRecording,
  deleteSession,
  clearCurrentData,
  updateSignalStrength,
} = telemetrySlice.actions;

export default telemetrySlice.reducer; 