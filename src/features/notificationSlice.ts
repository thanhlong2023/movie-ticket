import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationType = "success" | "danger" | "info" | "warning";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationState {
  notifications: Notification[];
  confirmDialog: ConfirmDialogState;
}

const initialState: NotificationState = {
  notifications: [],
  confirmDialog: {
    visible: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
  },
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification: (
      state,
      action: PayloadAction<{
        message: string;
        type: NotificationType;
        duration?: number;
      }>
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      state.notifications.push({
        id,
        message: action.payload.message,
        type: action.payload.type,
        duration: action.payload.duration || 3000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notif) => notif.id !== action.payload
      );
    },
    showConfirmDialog: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
      }>
    ) => {
      state.confirmDialog = {
        visible: true,
        title: action.payload.title,
        message: action.payload.message,
        confirmText: action.payload.confirmText || "Xác nhận",
        cancelText: action.payload.cancelText || "Hủy",
      };
    },
    hideConfirmDialog: (state) => {
      state.confirmDialog = {
        visible: false,
        title: "",
        message: "",
        confirmText: "Xác nhận",
        cancelText: "Hủy",
      };
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  showNotification,
  removeNotification,
  showConfirmDialog,
  hideConfirmDialog,
  clearAllNotifications,
} = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
