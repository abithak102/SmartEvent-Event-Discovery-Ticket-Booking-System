import { Link } from "react-router-dom";

function EventCard({ event }) {
  return (
    <article className="event-card">
      {event.banner_image && (
        <img
          className="event-banner"
          src={event.banner_image}
          alt={event.title}
        />
      )}

      <div className="event-card-content">
        <span className="event-category">{event.category}</span>

        <h3>{event.title}</h3>

        <p>📍 {event.location}</p>

        <p>
          📅{" "}
          {new Date(event.event_date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        <p className="event-price">
          ₹{Number(event.ticket_price).toFixed(2)} / ticket
        </p>

        <Link
          className="event-details-link"
          to={`/events/${event.id}`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default EventCard;