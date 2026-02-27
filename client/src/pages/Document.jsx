import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import Quill from "quill";
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

  const quillRef = useRef(null);
  const userColors = useRef({});

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
    if (!socket) return;
    socket.emit("join-document", id);
  }, [socket, id]);

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

      if (!userColors.current[socketId]) {
        userColors.current[socketId] =
          "#" + ((Math.random() * 0xffffff) | 0).toString(16);

        cursors.createCursor(
          socketId,
          remoteUser?.name || socketId.slice(0, 4),
          userColors.current[socketId]
        );
      }

      cursors.moveCursor(socketId, cursor);
    };

    socket.on("remote-cursor", handler);
    return () => socket.off("remote-cursor", handler);
  }, [socket]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <TopBar title="Editor" />

      <div className="editor-wrapper">
        <div style={{ marginBottom: 10, fontSize: 14, opacity: 0.7 }}>
          {saving ? "💾 Saving..." : "✅ Saved"}
        </div>

        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Document"
        />

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




