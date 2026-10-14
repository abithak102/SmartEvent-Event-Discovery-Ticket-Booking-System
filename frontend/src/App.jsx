import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventDetails from "./pages/EventDetails";
import MyBookings from "./pages/MyBookings";
import MyTickets from "./pages/MyTickets";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function ProtectedHome() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <Home /> : <Navigate to="/login" replace />;
}

function ProtectedEventDetails() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <EventDetails /> : <Navigate to="/login" replace />;
}

function ProtectedMyBookings() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <MyBookings /> : <Navigate to="/login" replace />;
}

function ProtectedMyTickets() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <MyTickets /> : <Navigate to="/login" replace />;
}

function ProtectedNotifications() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <Notifications /> : <Navigate to="/login" replace />;
}

function ProtectedProfile() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return user ? <Profile /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<ProtectedHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/events/:eventId"
            element={<ProtectedEventDetails />}
          />

          <Route
            path="/my-bookings"
            element={<ProtectedMyBookings />}
          />

          <Route
            path="/my-tickets"
            element={<ProtectedMyTickets />}
          />

          <Route
            path="/notifications"
            element={<ProtectedNotifications />}
          />

          <Route
            path="/profile"
            element={<ProtectedProfile />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;