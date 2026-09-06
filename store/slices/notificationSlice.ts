import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationType } from '@/types/notification';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_NOTIFICATIONS } from '@/lib/storage';

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: INITIAL_NOTIFICATIONS,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    hydrateNotifications: (state) => {
      state.notifications = getData<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    },
    addNotification: (
      state,
      action: PayloadAction<{
        recipientId: string;
        senderId: string;
        type: NotificationType;
        title: string;
        message: string;
        taskId?: string;
        projectId?: string;
      }>
    ) => {
      const newNotif: Notification = {
        id: `notif_${Date.now()}`,
        recipientId: action.payload.recipientId,
        senderId: action.payload.senderId,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        taskId: action.payload.taskId,
        projectId: action.payload.projectId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(newNotif);
      setData(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) {
        notif.read = true;
        setData(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
      }
    },
    markAllAsRead: (state, action: PayloadAction<string>) => {
      // action.payload is recipientId
      state.notifications.forEach((n) => {
        if (n.recipientId === action.payload) {
          n.read = true;
        }
      });
      setData(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      setData(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    },
  },
});

export const {
  hydrateNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
