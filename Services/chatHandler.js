// chatHandler.js
// This file handles WebSocket connections and chat messaging

let onlineUsers = []; // Track online users globally

export default (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining with username
    socket.on("join", ({ username }) => {
      // Add user to onlineUsers if not already there
      onlineUsers.push({ socketId: socket.id, username });

      console.log(`User joined: ${username}`);

      // Send updated online users list to all clients
      io.emit("online users", onlineUsers);

      // Optional: broadcast system message
      io.emit("chat message", {
        username: "System",
        message: `${username} joined the chat`,
        timestamp: Date.now(),
        type: "system",
      });
    });

    // Handle incoming chat messages
    socket.on("chat message", (msg) => {
      const messageWithTimestamp = {
        ...msg,
        timestamp: Date.now(),
        type: "user",
      };

      console.log(`Received message from ${msg.username}: ${msg.message}`);

      // Broadcast message to all clients
      io.emit("chat message", messageWithTimestamp);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
      // Remove user from onlineUsers
      const user = onlineUsers.find((u) => u.socketId === socket.id);
      if (user) {
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

        console.log(`User disconnected: ${user.username}`);

        // Update online users list for all clients
        io.emit("online users", onlineUsers);

        // Optional: broadcast system message
        io.emit("chat message", {
          username: "System",
          message: `${user.username} left the chat`,
          timestamp: Date.now(),
          type: "system",
        });
      }
    });
  });
};
