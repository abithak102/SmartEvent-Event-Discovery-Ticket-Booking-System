import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile } from "../services/authService";
import "../styles/Home.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <main className="home-page"><p>Loading profile...</p></main>;
  }

  if (error) {
    return (
      <main className="home-page">
        <Link to="/">← Back to Events</Link>
        <p className="events-error">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return <main className="home-page"><p>Profile not found.</p></main>;
  }

  return (
    <main className="home-page">
      <Link to="/">← Back to Events</Link>

      <h1>My Profile 👤</h1>
      <p>Your SmartEvent account details.</p>

      <section className="event-card">
        <div className="event-card-content">
          <h2>Account Information</h2>

          <p>
            <strong>User ID:</strong> {profile.id}
          </p>

          <p>
            <strong>Username:</strong>{" "}
            {profile.username || "Not available"}
          </p>

          <p>
            <strong>Email:</strong> {profile.email}
          </p>

          <p>
            <strong>Account Created:</strong>{" "}
            {profile.created_at
              ? new Date(profile.created_at).toLocaleString("en-IN")
              : "Not available"}
          </p>
        </div>
      </section>
    </main>
  );
}

export default Profile;