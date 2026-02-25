import Topbar from "../components/Topbar";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API = "http://localhost:5000/api/docs";

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [docs, setDocs] = useState([]);
  const navigate = useNavigate();

  /* =========================
     📥 Fetch docs
  ========================= */
  const fetchDocs = async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data);
    } catch (err) {
      console.log("Fetch failed");
    }
  };

  useEffect(() => {
    if (token) fetchDocs();
  }, [token]);

  /* =========================
     ➕ Create doc
  ========================= */
  const createDoc = async () => {
    try {
      const res = await axios.post(
        API,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/docs/${res.data._id}`);
    } catch (err) {
      console.log("Create failed");
    }
  };

  /* =========================
     🗑 Delete doc
  ========================= */
  const deleteDoc = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDocs();
    } catch (err) {
      console.log("Delete failed");
    }
  };

  /* =========================
     ✏ Rename doc
  ========================= */
  const renameDoc = async (id, title) => {
    try {
      await axios.put(
        `${API}/${id}/title`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDocs();
    } catch (err) {
      console.log("Rename failed");
    }
  };

  /* =========================
     🧠 Update title locally
  ========================= */
  const updateLocalTitle = (id, value) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc._id === id ? { ...doc, title: value } : doc
      )
    );
  };

  return (
    <div className="dashboard">
  <Topbar title="Dashboard" />
      <h1>Your Documents</h1>

      <button className="create-btn" onClick={createDoc}>
        ➕ New Document
      </button>

      <div className="doc-grid">
        {docs.map((doc) => (
          <div key={doc._id} className="doc-card glass">
            {/* 🔥 Editable title */}
            <input
              className="doc-title-input"
              value={doc.title || "Untitled"}
              onChange={(e) => updateLocalTitle(doc._id, e.target.value)}
              onBlur={() => renameDoc(doc._id, doc.title)}
            />

            <p className="doc-date">
              {new Date(doc.updatedAt).toLocaleString()}
            </p>

            <div className="doc-actions">
              <button onClick={() => navigate(`/docs/${doc._id}`)}>
                Open
              </button>

              <button
                className="delete-btn"
                onClick={() => deleteDoc(doc._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}