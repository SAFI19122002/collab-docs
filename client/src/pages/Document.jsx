import Topbar from "../components/Topbar";
import Quill from "quill";
import React, {
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { io } from "socket.io-client";
import QuillCursors from "quill-cursors";
import { AuthContext } from "../context/AuthContext";
import "../styles/editor.css";

Quill.register("modules/cursors", QuillCursors);

const SAVE_INTERVAL = 2000;
const SOCKET_URL = "http://localhost:5000";

export default function Document() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [value, setValue] = useState("");

  const quillRef = useRef(null);
  const userColors = useRef({});
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("Untitled Document");

  /* 🔌 Connect socket with JWT */
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  /* 🏠 Join document room */
  useEffect(() => {
    if (!socket) return;
    socket.emit("join-document", id);
  }, [socket, id]);

  /* 📥 Load document */
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${SOCKET_URL}/api/docs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
  setValue(res.data.data || "");
  setTitle(res.data.title || "Untitled Document");
});
  }, [id, token]);

  /* 💾 Auto-save */
/* 💾 Auto-save */
useEffect(() => {
  if (!token) return; // ❌ remove !value check

  const interval = setInterval(async () => {
    try {
      setSaving(true);

      await axios.put(
        `${SOCKET_URL}/api/docs/${id}`,
        { data: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTimeout(() => setSaving(false), 400); // smoother UX
    } catch (err) {
      console.log("Save failed");
      setSaving(false);
    }
  }, SAVE_INTERVAL);

  return () => clearInterval(interval);
}, [id, value, token]);

  /* ✍️ Send text changes */
  const handleChange = (content, delta, source) => {
    setValue(content);
    if (source !== "user" || !socket) return;

    socket.emit("send-changes", {
      docId: id,
      delta,
    });
  };

  /* 📡 Receive text changes */
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-changes", (delta) => {
      const quill = quillRef.current?.getEditor();
      if (quill) quill.updateContents(delta);
    });

    return () => socket.off("receive-changes");
  }, [socket]);

  /* 🖱 Cursor sync */
  useEffect(() => {
    if (!socket) return;

    socket.on("remote-cursor", ({ socketId, cursor, user }) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const cursors = quill.getModule("cursors");

      if (!userColors.current[socketId]) {
        userColors.current[socketId] =
          "#" + ((Math.random() * 0xffffff) | 0).toString(16);

        cursors.createCursor(
          socketId,
          user?.name || socketId.slice(0, 4),
          userColors.current[socketId]
        );
      }

      cursors.moveCursor(socketId, cursor);
    });

    return () => socket.off("remote-cursor");
  }, [socket]);
 
return (
  <div style={{ height: "100vh", width: "100vw" }}>
    <Topbar title="Editor" />

    <div className="editor-wrapper">
      {/* SAVE STATUS */}
      <div style={{ marginBottom: 10, fontSize: 14, opacity: 0.7 }}>
        {saving ? "💾 Saving..." : "✅ Saved"}
      </div>

      {/* TITLE */}
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled Document"
      />

      {/* EDITOR */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={{
          toolbar: true,
          cursors: { transformOnTextChange: true },
        }}
        onChangeSelection={(range, source) => {
          if (source !== "user" || !socket || !range) return;

          socket.emit("cursor-change", {
            docId: id,
            cursor: range,
            user,
          });
        }}
      />
    </div>
  </div>
);
}








