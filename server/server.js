require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const formRoutes = require("./routes/formRoutes"); 

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join-form-room", (formId) => {
    socket.join(formId);
  });
});

app.use("/api/forms", formRoutes);

app.get("/", (req, res) => {
  res.send("API & WebSockets Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});