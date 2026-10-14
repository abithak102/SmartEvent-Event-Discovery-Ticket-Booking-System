import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "../services/notificationService";
import "../styles/Home.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyNotifications();
      setNotifications(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      await markNotificationAsRead(notificationId);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not update notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="home-page">
      <Link to="/">← Back to Events</Link>

      <h1>Notifications 🔔</h1>
      <p>You have {unreadCount} unread notification(s).</p>

      {loading && <p>Loading notifications...</p>}

      {error && (
        <p className="events-error">{error}</p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <section>
          <h3>No notifications yet</h3>
          <p>
            Booking confirmations and other updates will appear here.
          </p>
        </section>
      )}

      {!loading && notifications.length > 0 && (
        <div className="events-grid">
          {notifications.map((notification) => (
            <article
              className="event-card"
              key={notification.id}
              style={{
                border: notification.is_read
                  ? "1px solid #ddd"
                  : "2px solid #2563eb",
              }}
            >
              <div className="event-card-content">
                <span className="event-category">
                  {notification.type}
                </span>

                <h3>{notification.title}</h3>

                <p>{notification.message}</p>

                <p>
                  {new Date(
                    notification.created_at
                  ).toLocaleString("en-IN")}
                </p>

                <p>
                  Status:{" "}
                  <strong>
                    {notification.is_read
                      ? "Read"
                      : "Unread"}
                  </strong>
                </p>

                {!notification.is_read && (
                  <button
                    type="button"
                    className="event-details-link"
                    disabled={updatingId === notification.id}
                    onClick={() =>
                      handleMarkAsRead(notification.id)
                    }
                  >
                    {updatingId === notification.id
                      ? "Updating..."
                      : "Mark as Read"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Notifications;