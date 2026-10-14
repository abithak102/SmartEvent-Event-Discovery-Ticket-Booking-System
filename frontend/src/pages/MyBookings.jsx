import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyBookings,
  cancelBooking,
} from "../services/bookingService";
import "../styles/Home.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not load your bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      setError("");
      setMessage("");

      await cancelBooking(bookingId);
      setMessage(`Booking #${bookingId} cancelled successfully.`);
      await loadBookings();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not cancel this booking."
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="home-page">
      <Link to="/">← Back to Events</Link>

      <h1>My Bookings</h1>
      <p>View and manage your event bookings.</p>

      {loading && <p>Loading bookings...</p>}

      {error && <p className="events-error">{error}</p>}

      {message && <p style={{ color: "green" }}>{message}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p>You have no bookings yet.</p>
      )}

      {!loading && bookings.length > 0 && (
        <div className="events-grid">
          {bookings.map((booking) => (
            <article className="event-card" key={booking.id}>
              <div className="event-card-content">
                <h3>Booking #{booking.id}</h3>

                <p>Event ID: {booking.event_id}</p>
                <p>Tickets: {booking.ticket_quantity}</p>
                <p>
                  Total: ₹{Number(booking.total_price).toFixed(2)}
                </p>

                <p>
                  Status: <strong>{booking.booking_status}</strong>
                </p>

                <p>
                  Booked on:{" "}
                  {new Date(booking.created_at).toLocaleString("en-IN")}
                </p>

                {booking.booking_status !== "CANCELLED" && (
                  <button
                    className="logout-button"
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                  >
                    {cancellingId === booking.id
                      ? "Cancelling..."
                      : "Cancel Booking"}
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

export default MyBookings;