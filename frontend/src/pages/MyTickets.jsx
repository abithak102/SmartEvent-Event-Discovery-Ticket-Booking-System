import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyTickets,
  generateTickets,
} from "../services/ticketService";
import "../styles/Home.css";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not load your tickets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleGenerate = async (bookingId) => {
    try {
      setGeneratingId(bookingId);
      setError("");
      setMessage("");

      await generateTickets(bookingId);
      setMessage(`Tickets generated for booking #${bookingId}.`);
      await loadTickets();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not generate tickets."
      );
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <main className="home-page">
      <Link to="/">← Back to Events</Link>

      <h1>My Tickets 🎟️</h1>
      <p>Your event tickets and QR codes.</p>

      {loading && <p>Loading tickets...</p>}

      {error && <p className="events-error">{error}</p>}

      {message && <p style={{ color: "green" }}>{message}</p>}

      {!loading && tickets.length === 0 && (
        <section>
          <p>No tickets generated yet.</p>
          <p>Generate tickets from one of your confirmed bookings.</p>
          <Link to="/my-bookings">Go to My Bookings</Link>
        </section>
      )}

      {!loading && tickets.length > 0 && (
        <div className="events-grid">
          {tickets.map((ticket) => (
            <article className="event-card" key={ticket.id}>
              <div className="event-card-content">
                <h3>Ticket #{ticket.id}</h3>

                <p>
                  <strong>Ticket Code:</strong>
                </p>
                <p>{ticket.ticket_code}</p>

                <p>Booking ID: {ticket.booking_id}</p>

                {ticket.qr_code_url && (
                  <div>
                    <img
                      src={ticket.qr_code_url}
                      alt={`QR code for ${ticket.ticket_code}`}
                      style={{
                        display: "block",
                        width: 200,
                        maxWidth: "100%",
                        margin: "16px auto",
                      }}
                    />

                    <a
                      href={ticket.qr_code_url}
                      download={`${ticket.ticket_code}-QR.png`}
                      className="event-details-link"
                    >
                      Download QR Code
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && (
        <section style={{ marginTop: 30 }}>
          <h2>Generate Tickets</h2>
          <p>
            If you have a confirmed booking without tickets, enter its
            booking ID below.
          </p>
          <GenerateTicketForm
            onGenerate={handleGenerate}
            generatingId={generatingId}
          />
        </section>
      )}
    </main>
  );
}

function GenerateTicketForm({ onGenerate, generatingId }) {
  const [bookingId, setBookingId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!bookingId || Number(bookingId) < 1) return;
    onGenerate(Number(bookingId));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        min="1"
        value={bookingId}
        onChange={(event) => setBookingId(event.target.value)}
        placeholder="Enter booking ID"
        required
        style={{ padding: 10, marginRight: 10, width: 180 }}
      />

      <button
        type="submit"
        className="event-details-link"
        disabled={generatingId !== null}
      >
        {generatingId === Number(bookingId)
          ? "Generating..."
          : "Generate Tickets"}
      </button>
    </form>
  );
}

export default MyTickets;