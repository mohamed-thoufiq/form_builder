require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const formRoutes = require("./routes/formRoutes"); 

const app = express();
const server = http.createServer(app);

// 1. CONFIGURE CORS
// Replace the Vercel link with your actual frontend URL once deployed
const allowedOrigins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5500",
    "https://form-builder-amber-five.vercel.app/"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

// 2. CONFIGURE SOCKET.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Make io accessible in your routes
app.set("io", io);

// 3. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 4. SOCKET LOGIC
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on("join-form-room", (formId) => {
        socket.join(formId);
    });
});

// 5. ROUTES
app.use("/api/forms", formRoutes);

app.get("/", (req, res) => {
    res.send("API & WebSockets Running");
});

// 6. START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});