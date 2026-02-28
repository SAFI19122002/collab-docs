import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Document from "./pages/Document";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 🔒 PROTECTED DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* 🔒 PROTECTED DOCUMENT */}
      <Route
        path="/docs/:id"
        element={
          <ProtectedRoute>
            <Document />
          </ProtectedRoute>
        }
      />

      {/* 🔄 CATCH ALL - FIXES BLANK SCREEN REFRESHES */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}