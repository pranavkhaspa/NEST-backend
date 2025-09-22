import express from 'express';
import http from 'http'; // Import the built-in Node.js http module
import startScraperJob from './Cronjob/unstopScraper.js';
import { Server } from "socket.io"; // Import the Server class from socket.io
import connectDB from './Config/db.js';
import userRoutes from './Routes/userRoutes.js';
import postRoutes from './Routes/postRoutes.js';
import infoApi from "./Routes/infoRoute.js";
import opportunityRoutes from './Routes/OpportunityRoutes.js';
import chatHandler from './Services/chatHandler.js';
import 'dotenv/config';

// Connect to the database
connectDB();
startScraperJob();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create the Socket.IO server and attach it to the HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Allows connections from any origin (for development)
        methods: ["GET", "POST"]
    }
});

// Define a separate file for your WebSocket logic

chatHandler(io); // Pass the io instance to your handler

// Routes
// Your info route should be mounted with `app.use` if it's a router
// and not a simple function passed to `app.get`.
app.use('/api', infoApi); 
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/opportunities', opportunityRoutes); 

// Start the server using the http server instance, not the express app
server.listen(PORT, () => {
    console.log(`Server and WebSocket running on port ${PORT}`);
});
