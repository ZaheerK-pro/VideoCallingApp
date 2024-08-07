const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.static("public"));

// Redirect root to a new room
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Render the room page
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("New user connected");

  // Join a room
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    setTimeout(() => {
      socket.to(roomId).emit("user-connected", userId);
    }, 1000);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    io.emit("user-disconnected", socket.id); // Send the socket ID to identify which user disconnected
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log("Server is running on port", process.env.PORT || 3030);
});
