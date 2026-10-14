import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-brand">
        SmartEvent
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/my-bookings">My Bookings</NavLink>
        <NavLink to="/my-tickets">My Tickets</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/profile">My Profile</NavLink>

        {user && (
          <button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

export default Navbar;