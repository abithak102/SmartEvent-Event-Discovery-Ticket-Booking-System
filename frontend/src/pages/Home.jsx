import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getEvents } from "../services/eventService";
import EventCard from "../components/EventCard";
import "../styles/Home.css";

function Home() {
  const { user, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getEvents({
          search: search || undefined,
          category: category || undefined,
        });

        setEvents(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Could not load events. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [search, category]);

  return (
    <main className="home-page">
      <header className="home-header">
        <div>
          <h1>SmartEvent 🎉</h1>
          <p>
            Welcome, {user?.username || user?.email || "User"}!
          </p>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </header>

      <section className="events-hero">
        <h2>Discover Amazing Events</h2>
        <p>Find events, explore experiences, and book your tickets.</p>
      </section>

      <section className="event-filters">
        <input
          type="search"
          placeholder="Search events by title..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Music">Music</option>
          <option value="Tech">Tech</option>
          <option value="Sports">Sports</option>
          <option value="Business">Business</option>
        </select>
      </section>

      <section className="events-section">
        <h2>Upcoming Events</h2>

        {loading && <p>Loading events...</p>}

        {!loading && error && (
          <p className="events-error">{error}</p>
        )}

        {!loading && !error && events.length === 0 && (
          <p>No events found. Try another search or category.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;