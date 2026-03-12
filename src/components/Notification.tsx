import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { createPortal } from "react-dom";

interface NotificationProps {
  messenger: string;
  type: "success" | "danger";
  duration?: number;
}

function Notification({ messenger, type, duration = 1500 }: NotificationProps) {
  const [visible, setVisible] = useState(true);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setIsHiding(true), duration - 400);
    const removeTimer = setTimeout(() => setVisible(false), duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  if (!visible) return null;

  const alertElement = (
    <Alert
      variant={type}
      className={`alert alert-${type} ${isHiding ? "hide" : ""}`}
    >
      {messenger}
    </Alert>
  );

  return createPortal(alertElement, document.body);
}

export default Notification;
