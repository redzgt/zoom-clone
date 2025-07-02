const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// ✅ Serve frontend
app.use(express.static("public")); // <--- THIS is key!

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    const users = io.sockets.adapter.rooms.get(roomId);
    const numUsers = users ? users.size : 0;

    socket.to(roomId).emit("user-joined", userId);
    socket.emit("joined-room", { initiator: numUsers > 1 });

    socket.on("offer", data => socket.to(roomId).emit("offer", data));
    socket.on("answer", data => socket.to(roomId).emit("answer", data));
    socket.on("ice-candidate", data => socket.to(roomId).emit("ice-candidate", data));

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
