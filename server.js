// === server.js === (with nickname support, signaling, and static serving)

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

const userNicknames = {}; // store nicknames by socket ID

io.on("connection", socket => {
  socket.on("join-room", ({ roomId, userId, nickname }) => {
    socket.join(roomId);
    userNicknames[socket.id] = nickname || "Anonymous";

    const users = io.sockets.adapter.rooms.get(roomId);
    const numUsers = users ? users.size : 0;

    socket.to(roomId).emit("user-joined", { userId, nickname });
    socket.emit("joined-room", { initiator: numUsers > 1 });

    socket.on("offer", data => socket.to(roomId).emit("offer", data));
    socket.on("answer", data => socket.to(roomId).emit("answer", data));
    socket.on("ice-candidate", data => socket.to(roomId).emit("ice-candidate", data));
    socket.on("screen-share", data => socket.to(roomId).emit("screen-share", data));
    socket.on("stop-screen-share", () => socket.to(roomId).emit("stop-screen-share"));

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", { userId, nickname: userNicknames[socket.id] });
      delete userNicknames[socket.id];
    });
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
