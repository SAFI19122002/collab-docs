const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();

/* ======================
   🔹 MIDDLEWARE (STEP 4)
   ====================== */
app.use(cors({
  origin: ["http://localhost:5173",
  "https://YOUR-VERCEL-URL.vercel.app",],
  credentials: true,
}));

app.use(express.json());

/* ======================
   🔹 ROUTES (STEP 4)
   ====================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/docs", require("./routes/docs"));

/* ======================
   🔹 TEST ROUTE
   ====================== */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ======================
   🔹 SERVER + SOCKET
   ====================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* ======================
   🔥 SOCKET LOGIC
   ====================== */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-document", (docId) => {
    socket.join(docId);
    console.log(`User joined document ${docId}`);
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
  });
});

/* ======================
   🔹 START SERVER
   ====================== */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
