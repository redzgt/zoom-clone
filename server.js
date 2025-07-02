// === server.js === (Node.js + Socket.IO signaling server with join count)

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  console.log("New client connected");

  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);

    const users = io.sockets.adapter.rooms.get(roomId);
    const numUsers = users ? users.size : 0;

    console.log(`User ${userId} joined room ${roomId} (${numUsers} total)`);

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
server.listen(PORT, () => console.log(`Signaling server running on port ${PORT}`));
