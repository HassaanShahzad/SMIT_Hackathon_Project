import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog } from '@/types/notification';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_ACTIVITIES } from '@/lib/storage';

interface ActivityState {
  activities: ActivityLog[];
}

const initialState: ActivityState = {
  activities: INITIAL_ACTIVITIES,
};

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    hydrateActivities: (state) => {
      state.activities = getData<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    },
    logActivity: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        projectId?: string;
        taskId?: string;
        userId: string;
        action: string;
        details?: string;
      }>
    ) => {
      const entry: ActivityLog = {
        id: `act_${Date.now()}`,
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        taskId: action.payload.taskId,
        userId: action.payload.userId,
        action: action.payload.action,
        details: action.payload.details,
        timestamp: new Date().toISOString(),
      };
      state.activities.unshift(entry);
      // Keep last 150 items to keep localStorage clean
      if (state.activities.length > 150) {
        state.activities = state.activities.slice(0, 150);
      }
      setData(STORAGE_KEYS.ACTIVITIES, state.activities);
    },
  },
});

export const { hydrateActivities, logActivity } = activitySlice.actions;

export default activitySlice.reducer;
