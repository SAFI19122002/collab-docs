const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

/* ======================
   🔹 MIDDLEWARE
   ====================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://docsguru-j3by.onrender.com",
  "https://docsguru.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* ======================
   🔹 ROUTES
   ====================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/docs", require("./routes/docs"));

/* ======================
   🔹 TEST ROUTE
   ====================== */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ======================
   🔹 SERVER + SOCKET
   ====================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* ======================
   🔥 SOCKET LOGIC
   ====================== */
const documentUsers = {}; // Map: docId -> array of { socketId, user }
const socketToDoc = {};   // Map: socketId -> docId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-document", ({ docId, user }) => {
    socket.join(docId);

    // Store mapping of socket to doc
    socketToDoc[socket.id] = docId;

    // Initialize document array if not exists
    if (!documentUsers[docId]) {
      documentUsers[docId] = [];
    }

    // Add user if they provided info (e.g. from context)
    if (user) {
      // Prevent duplicates from same socket reconnects
      documentUsers[docId] = documentUsers[docId].filter(u => u.socketId !== socket.id);
      documentUsers[docId].push({ socketId: socket.id, user });
    }

    console.log(`User joined document ${docId}`);

    // Broadcast updated active users list back to the room
    io.to(docId).emit("active-users", documentUsers[docId]);
  });

  socket.on("send-changes", ({ docId, delta }) => {
    socket.to(docId).emit("receive-changes", delta);
  });

  socket.on("cursor-change", ({ docId, cursor, user }) => {
    socket.to(docId).emit("remote-cursor", {
      socketId: socket.id,
      cursor,
      user,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const docId = socketToDoc[socket.id];
    if (docId) {
      // Remove user from the document tracking
      if (documentUsers[docId]) {
        documentUsers[docId] = documentUsers[docId].filter(u => u.socketId !== socket.id);

        // Broadcast updated users list
        io.to(docId).emit("active-users", documentUsers[docId]);

        // Tell clients to specifically remove this socket's cursor
        socket.to(docId).emit("remove-cursor", socket.id);

        // Clean up empty rooms to save memory
        if (documentUsers[docId].length === 0) {
          delete documentUsers[docId];
        }
      }
      delete socketToDoc[socket.id];
    }
  });
});

/* ======================
   🔹 START SERVER
   ====================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);