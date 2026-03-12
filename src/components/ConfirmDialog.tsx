import { useAppSelector, useAppDispatch } from "../hook/hook";
import { hideConfirmDialog } from "../features/notificationSlice";
import { useEffect, useState } from "react";

// Extend Window interface to include our callback properties
declare global {
  interface Window {
    __confirmCallback?: () => void;
    __cancelCallback?: () => void;
  }
}

const ConfirmDialog = () => {
  const confirmDialog = useAppSelector(
    (state) => state.notifications.confirmDialog
  );
  const dispatch = useAppDispatch();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (confirmDialog.visible) {
      // Small delay for smooth entrance
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setIsVisible(false);
      });
    }
  }, [confirmDialog.visible]);

  if (!confirmDialog.visible) return null;

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      // Call the callback stored in window
      const callback = window.__cancelCallback;
      if (callback) {
        callback();
        window.__cancelCallback = undefined;
      }
      dispatch(hideConfirmDialog());
    }, 200);
  };

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => {
      // Call the callback stored in window
      const callback = window.__confirmCallback;
      if (callback) {
        callback();
        window.__confirmCallback = undefined;
      }
      dispatch(hideConfirmDialog());
    }, 200);
  };

  return (
    <div
      className={`confirm-backdrop ${
        isVisible ? "confirm-backdrop-enter" : ""
      }`}
      onClick={handleCancel}
    >
      <div
        className={`confirm-dialog ${isVisible ? "confirm-dialog-enter" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="confirm-title">{confirmDialog.title}</h3>
        <p className="confirm-message">{confirmDialog.message}</p>
        <div className="confirm-actions">
          <button
            className="confirm-btn confirm-btn-cancel"
            onClick={handleCancel}
          >
            {confirmDialog.cancelText}
          </button>
          <button
            className="confirm-btn confirm-btn-confirm"
            onClick={handleConfirm}
          >
            {confirmDialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
