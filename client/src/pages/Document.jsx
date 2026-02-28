import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import QuillCursors from "quill-cursors";

import API from "../api/axios";
import TopBar from "../components/TopBar";
import { AuthContext } from "../context/AuthContext";
import "../styles/editor.css";

Quill.register("modules/cursors", QuillCursors);

const SOCKET_URL = "https://docsguru.onrender.com";
const SAVE_INTERVAL = 2000;

export default function Document() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("Untitled Document");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState(null); // { type: 'success' | 'error', msg: string }

  const quillRef = useRef(null);
  const userColors = useRef({});
  const createdCursors = useRef(new Set());

  // Fix: Memoize the modules so ReactQuill doesn't destroy and recreate the cursors module on every keystroke
  const modules = React.useMemo(
    () => ({
      toolbar: true,
      cursors: {
        transformOnTextChange: true,
      },
    }),
    []
  );

  /* 🔌 SOCKET CONNECT */
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(s);
    return () => s.disconnect();
  }, []);

  /* 🏠 JOIN ROOM */
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join-document", { docId: id, user });
  }, [socket, id, user]);

  /* 📥 LOAD DOCUMENT */
  useEffect(() => {
    if (!token) return;

    API.get(`/api/docs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setValue(res.data.data || "");
      setTitle(res.data.title || "Untitled Document");
      setLoaded(true);
    });
  }, [id, token]);

  /* 💾 AUTO SAVE */
  useEffect(() => {
    if (!token || !loaded) return;

    const timer = setTimeout(async () => {
      try {
        setSaving(true);

        await API.put(
          `/api/docs/${id}`,
          { data: value, title },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTimeout(() => setSaving(false), 400);
      } catch {
        setSaving(false);
      }
    }, SAVE_INTERVAL);

    return () => clearTimeout(timer);
  }, [id, value, title, token, loaded]);

  /* ✍️ SEND CHANGES */
  const handleChange = (content, delta, source) => {
    setValue(content);
    if (source !== "user" || !socket) return;

    socket.emit("send-changes", { docId: id, delta });
  };

  /* 📡 RECEIVE CHANGES */
  useEffect(() => {
    if (!socket) return;

    const handler = (delta) => {
      const quill = quillRef.current?.getEditor();
      if (quill) quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket]);

  /* 🖱 CURSOR SYNC */
  useEffect(() => {
    if (!socket) return;

    const handler = ({ socketId, cursor, user: remoteUser }) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const cursors = quill.getModule("cursors");
      if (!cursors) return;

      if (!userColors.current[socketId]) {
        userColors.current[socketId] =
          "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      }

      // Check if the cursor exists in quill-cursors memory!
      if (!createdCursors.current.has(socketId)) {
        cursors.createCursor(
          socketId,
          remoteUser?.name || socketId.slice(0, 4),
          userColors.current[socketId]
        );
        createdCursors.current.add(socketId);
      }

      cursors.moveCursor(socketId, cursor);
      cursors.update(); // Explicitly force cursor UI update
    };

    socket.on("remote-cursor", handler);
    return () => socket.off("remote-cursor", handler);
  }, [socket]);

  /* 📥 DOWNLOAD HANDLER */
  const handleDownload = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const html = quill.root.innerHTML;

    // Create a beautiful standalone HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title || "Document"}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 60px; max-width: 900px; margin: 0 auto; line-height: 1.6; color: #333; }
            h1 { margin-bottom: 24px; font-size: 2.5rem; letter-spacing: -0.02em; }
            img { max-width: 100%; height: auto; border-radius: 8px; }
            pre { background: #f4f4f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
            blockquote { border-left: 4px solid #cbd5e1; padding-left: 16px; color: #64748b; margin-left: 0; }
          </style>
        </head>
        <body>
          <h1>${title || "Document"}</h1>
          ${html}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "DocsGuru-Document"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* 📨 SHARE HANDLER */
  const handleShare = async (e) => {
    e.preventDefault();
    setShareStatus({ type: "loading", msg: "Inviting..." });

    try {
      const res = await API.post(
        `/api/docs/${id}/invite`,
        { email: shareEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareStatus({ type: "success", msg: res.data.msg });
      setTimeout(() => {
        setShowShareModal(false);
        setShareEmail("");
        setShareStatus(null);
      }, 2000);
    } catch (err) {
      setShareStatus({
        type: "error",
        msg: err.response?.data?.msg || "Failed to invite user.",
      });
    }
  };

  /* 👥 ACTIVE USERS & CURSOR CLEANUP */
  useEffect(() => {
    if (!socket) return;

    const handleActiveUsers = (users) => setActiveUsers(users);

    const handleRemoveCursor = (socketId) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      const cursors = quill.getModule("cursors");
      if (cursors) {
        cursors.removeCursor(socketId);
        createdCursors.current.delete(socketId);
        delete userColors.current[socketId];
      }
    };

    socket.on("active-users", handleActiveUsers);
    socket.on("remove-cursor", handleRemoveCursor);

    return () => {
      socket.off("active-users", handleActiveUsers);
      socket.off("remove-cursor", handleRemoveCursor);
    };
  }, [socket]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <TopBar title="Editor" />

      <div className="editor-wrapper">
        <div className="editor-header">
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Document"
          />
          <div className="header-actions">
            <div className="active-users">
              {activeUsers.map((u) => {
                // Ensure a stable color exists for this socketId
                if (!userColors.current[u.socketId]) {
                  userColors.current[u.socketId] = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                }
                const color = userColors.current[u.socketId];

                return (
                  <div
                    key={u.socketId}
                    className="user-avatar"
                    title={u.user?.name || "Anonymous"}
                    style={{ backgroundColor: color }}
                  >
                    {u.user?.name ? u.user.name.charAt(0).toUpperCase() : "?"}
                  </div>
                );
              })}
            </div>
            <div className="save-status">
              {saving ? "🔄 Saving..." : "✓ Saved"}
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                padding: "6px 16px",
                fontSize: "0.9rem",
                fontWeight: "600",
                backgroundColor: "var(--card)",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                borderRadius: "99px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                marginLeft: "8px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "var(--card)";
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🤝 Share
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: "6px 16px",
                fontSize: "0.9rem",
                fontWeight: "600",
                backgroundColor: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "99px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "transform 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              📥 Download
            </button>
          </div>
        </div>

        {loaded ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            defaultValue={value}
            onChange={handleChange}
            modules={modules}
            onChangeSelection={(range, source) => {
              if (source !== "user" || !socket || !range) return;

              socket.emit("cursor-change", {
                docId: id,
                cursor: range,
                user,
              });
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading document...</div>
        )}
      </div>

      {/* 🤝 SHARE MODAL */}
      {showShareModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--card)", padding: "32px", borderRadius: "16px",
            width: "100%", maxWidth: "400px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px", color: "var(--text)" }}>Share Document</h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "24px" }}>
              Invite a collaborator to edit this document with you in real-time.
            </p>

            <form onSubmit={handleShare}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)", color: "var(--text)", fontSize: "1rem"
                  }}
                />
              </div>

              {shareStatus && (
                <div style={{
                  padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem",
                  backgroundColor: shareStatus.type === "error" ? "#fef2f2" : "#f0fdf4",
                  color: shareStatus.type === "error" ? "#991b1b" : "#166534",
                  border: `1px solid ${shareStatus.type === "error" ? "#fecaca" : "#bbf7d0"}`
                }}>
                  {shareStatus.msg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setShowShareModal(false); setShareStatus(null); setShareEmail(""); }}
                  style={{
                    padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)",
                    backgroundColor: "transparent", color: "var(--text-muted)", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shareStatus?.type === "loading"}
                  style={{
                    padding: "10px 20px", borderRadius: "8px", border: "none",
                    backgroundColor: "var(--primary)", color: "white", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  {shareStatus?.type === "loading" ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




