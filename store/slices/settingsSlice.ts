import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationPreferences } from '@/types/notification';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData } from '@/lib/storage';

export type AppTheme = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: AppTheme;
  compactMode: boolean;
  simulateNetworkDelay: boolean;
  delayMs: number;
  simulateFailureRate: number; // percentage 0-100
  notificationPreferences: NotificationPreferences;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  compactMode: false,
  simulateNetworkDelay: false,
  delayMs: 350,
  simulateFailureRate: 0,
  notificationPreferences: {
    taskAssigned: true,
    mentions: true,
    dueDateReminders: true,
    statusChanges: true,
  },
};

const initialState: AppSettings = DEFAULT_SETTINGS;

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    hydrateSettings: (state) => {
      const stored = getData<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      const directTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') as AppTheme) : null;
      const theme = directTheme || stored?.theme || DEFAULT_SETTINGS.theme;
      return { ...state, ...stored, theme };
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
      setData(STORAGE_KEYS.SETTINGS, state);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('theme', action.payload);
        } catch (e) {}
      }
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
      setData(STORAGE_KEYS.SETTINGS, state);
    },
    setSimulateNetworkDelay: (state, action: PayloadAction<boolean>) => {
      state.simulateNetworkDelay = action.payload;
      setData(STORAGE_KEYS.SETTINGS, state);
    },
    setDelayMs: (state, action: PayloadAction<number>) => {
      state.delayMs = action.payload;
      setData(STORAGE_KEYS.SETTINGS, state);
    },
    setSimulateFailureRate: (state, action: PayloadAction<number>) => {
      state.simulateFailureRate = action.payload;
      setData(STORAGE_KEYS.SETTINGS, state);
    },
    updateNotificationPreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload,
      };
      setData(STORAGE_KEYS.SETTINGS, state);
    },
  },
});

export const {
  hydrateSettings,
  setTheme,
  setCompactMode,
  setSimulateNetworkDelay,
  setDelayMs,
  setSimulateFailureRate,
  updateNotificationPreferences,
} = settingsSlice.actions;

export default settingsSlice.reducer;
