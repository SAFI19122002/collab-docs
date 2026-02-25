import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  /* ✅ SAFE USER PARSE */
  let parsedUser = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      parsedUser = JSON.parse(storedUser);
    }
  } catch (err) {
    console.log("User parse failed");
  }

  const [user, setUser] = useState(parsedUser);
  const [token, setToken] = useState(localStorage.getItem("token"));

  /* 🔐 LOGIN */
  const login = (data) => {
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
