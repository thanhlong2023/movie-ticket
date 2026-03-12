import { useEffect, useState } from "react";
import type { Notification as NotificationType } from "../features/notificationSlice";

interface ToastNotificationProps {
  notification: NotificationType;
  onRemove: (id: string) => void;
}

const ToastNotification = ({
  notification,
  onRemove,
}: ToastNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = notification.duration || 3000;

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 16); // ~60fps

    // Start exit animation before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 400);

    // Remove notification
    const removeTimer = setTimeout(() => {
      onRemove(notification.id);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, duration, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "✓";
      case "danger":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "ℹ";
    }
  };

  const getEmoji = () => {
    switch (notification.type) {
      case "success":
        return "🎉";
      case "danger":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "💡";
      default:
        return "💡";
    }
  };

  return (
    <div
      className={`toast-notification toast-${notification.type} ${
        isVisible ? "toast-enter" : ""
      } ${isExiting ? "toast-exit" : ""}`}
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          <span className="toast-emoji">{getEmoji()}</span>
          <span className="toast-icon">{getIcon()}</span>
        </div>
        <div className="toast-message">{notification.message}</div>
        <button
          className="toast-close"
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onRemove(notification.id), 300);
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      <div
        className="toast-progress"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
};

export default ToastNotification;
