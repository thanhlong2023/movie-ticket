import { useAppSelector, useAppDispatch } from "../hook/hook";
import { removeNotification } from "../features/notificationSlice";
import ToastNotification from "./ToastNotification";

const NotificationContainer = () => {
  const notifications = useAppSelector(
    (state) => state.notifications.notifications
  );
  const dispatch = useAppDispatch();

  const handleRemove = (id: string) => {
    dispatch(removeNotification(id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
