import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEventById } from "../services/eventService";
import { createBooking } from "../services/bookingService";
import "../styles/Home.css";

function EventDetails() {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getEventById(eventId)
      .then(setEvent)
      .catch((err) => {
        setError(
          err.response?.data?.detail || "Could not load event details."
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleBooking = async () => {
    setError("");
    setMessage("");

    try {
      setBooking(true);

      const result = await createBooking({
        event_id: Number(eventId),
        ticket_quantity: Number(quantity),
      });

      setMessage(
        `Booking successful! Booking ID: ${result.id}. Total: ₹${Number(
          result.total_price
        ).toFixed(2)}`
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(", ")
          : detail || "Booking failed. Please try again."
      );
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p>Loading event details...</p>;

  if (error && !event) {
    return (
      <main className="home-page">
        <p className="events-error">{error}</p>
        <Link to="/">Back to events</Link>
      </main>
    );
  }

  if (!event) return <p>Event not found.</p>;

  return (
    <main className="home-page">
      <Link to="/">← Back to Events</Link>

      <article className="event-card" style={{ marginTop: 24 }}>
        {event.banner_image && (
          <img
            className="event-banner"
            src={event.banner_image}
            alt={event.title}
          />
        )}

        <div className="event-card-content">
          <span className="event-category">{event.category}</span>
          <h1>{event.title}</h1>

          <p>{event.description}</p>
          <p>📍 {event.location}</p>
          <p>
            📅{" "}
            {new Date(event.event_date).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="event-price">
            ₹{Number(event.ticket_price).toFixed(2)} per ticket
          </p>

          <label htmlFor="quantity">Number of tickets</label>
          <br />

          <input
            id="quantity"
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= 10) setQuantity(value);
            }}
            style={{ padding: 10, marginTop: 8, width: 100 }}
          />

          <h3>
            Total: ₹
            {(Number(event.ticket_price) * quantity).toFixed(2)}
          </h3>

          <button
            className="logout-button"
            onClick={handleBooking}
            disabled={booking}
          >
            {booking ? "Booking..." : "Book Tickets"}
          </button>

          {message && (
            <p style={{ color: "green", marginTop: 16 }}>{message}</p>
          )}

          {error && (
            <p className="events-error" style={{ marginTop: 16 }}>
              {error}
            </p>
          )}

          {message && (
            <p>
              <Link to="/my-bookings">View My Bookings</Link>
            </p>
          )}
        </div>
      </article>
    </main>
  );
}

export default EventDetails;