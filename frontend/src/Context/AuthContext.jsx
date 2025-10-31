import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Safe localStorage access with proper null/undefined handling
  const getInitialUserState = () => {
    const userData = localStorage.getItem("user");
    if (!userData || userData === "undefined") return null;
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Failed to parse user data, clearing invalid data:", error);
      localStorage.removeItem("user");
      return null;
    }
  };

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [user, setUser] = useState(getInitialUserState);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const isLoggedIn = !!token;

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  const loginUser = (newToken, newRole, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setRole(newRole);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logoutUser();
    }
  }, [token]);

  const contextValue = useMemo(() => ({
    token,
    role,
    user,
    isLoggedIn,
    loginUser,
    logoutUser,
    API
  }), [token, role, user, isLoggedIn, API]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};