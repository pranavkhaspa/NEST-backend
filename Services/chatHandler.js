// This file handles WebSocket connections and chat messaging
export default (io) => {
    // Listen for new connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle incoming chat messages
        // The message object will contain the user's name and the message content.
        socket.on('chat message', (msg) => {
            console.log(`Received message from ${msg.username}: ${msg.message}`);
            
            // Broadcast the message to all connected clients
            // `io.emit()` sends to all clients, including the sender
            io.emit('chat message', {
                username: msg.username,
                message: msg.message,
                timestamp: Date.now()
            });
        });

        // Handle disconnections
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
