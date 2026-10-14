
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  getMyProfile,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("smartevent_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getMyProfile()
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem("smartevent_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const result = await loginUser(credentials);

    localStorage.setItem(
      "smartevent_token",
      result.access_token
    );

    try {
      const profile = await getMyProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      localStorage.removeItem("smartevent_token");
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("smartevent_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
