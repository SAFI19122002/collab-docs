import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  /* ✅ SAFE USER INIT (runs once) */
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      console.log("User parse failed");
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  /* 🔐 LOGIN */
  const login = (data) => {
    console.log("LOGIN DATA:", data);

    setUser(data.user);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  /* 🚪 LOGOUT */
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}