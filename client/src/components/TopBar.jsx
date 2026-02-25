import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import "../styles/editor.css";

export default function TopBar({ title }) {
  const { user, logout } = useContext(AuthContext);
  const { dark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <div className="topbar glass">
      <h2 className="topbar-title">{title}</h2>

      <div className="topbar-actions">
        {/* 🌙 Dark toggle */}
        <button className="theme-btn" onClick={toggleTheme}>
          {dark ? "☀ Light" : "🌙 Dark"}
        </button>

        {/* 👤 User */}
        <span className="user-name">{user?.name}</span>

        {/* ⬅ Dashboard */}
        <button className="back-btn" onClick={() => navigate("/")}>
          Dashboard
        </button>

        {/* 🚪 Logout */}
        <button
          className="logout-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}