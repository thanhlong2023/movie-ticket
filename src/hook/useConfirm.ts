import { useAppDispatch } from "./hook";
import {
  showConfirmDialog,
  hideConfirmDialog,
} from "../features/notificationSlice";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const useConfirm = () => {
  const dispatch = useAppDispatch();

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const handleConfirm = () => {
        resolve(true);
        dispatch(hideConfirmDialog());
      };

      const handleCancel = () => {
        resolve(false);
        dispatch(hideConfirmDialog());
      };

      dispatch(
        showConfirmDialog({
          title: options.title || "Xác nhận",
          message: options.message,
          confirmText: options.confirmText || "Xác nhận",
          cancelText: options.cancelText || "Hủy",
        })
      );

      // Store callbacks in window for the ConfirmDialog to access
      window.__confirmCallback = handleConfirm;
      window.__cancelCallback = handleCancel;
    });
  };

  return confirm;
};
