import express from 'express';
import http from 'http';
import startScraperJob from './Cronjob/unstopScraper.js';
import { Server } from "socket.io";
import connectDB from './Config/db.js';
import userRoutes from './Routes/userRoutes.js';
import postRoutes from './Routes/postRoutes.js';
import infoApi from "./Routes/infoRoute.js";
import opportunityRoutes from './Routes/OpportunityRoutes.js';
import chatHandler from './Services/chatHandler.js';
import 'dotenv/config';
import { auth } from 'express-oauth2-jwt-bearer'; // Import the Auth0 middleware
import User from './Models/user.js'; // Import the User model

// Connect to the database
connectDB();
startScraperJob();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Auth0 JWT Validation Middleware
// NOTE: Make sure to set these environment variables in your .env file
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create the Socket.IO server and attach it to the HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Define a separate file for your WebSocket logic
chatHandler(io);

// --- Routes ---
app.use('/api', infoApi); 

// This route is public for now, but you might want to protect it later
app.use('/api/users', userRoutes); 

app.use('/api/posts', checkJwt, postRoutes);
app.use('/api/opportunities', checkJwt, opportunityRoutes); 

// New route to handle Auth0 user authentication and sync with your DB
app.post('/api/auth/login', checkJwt, async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        
        // Find user by Auth0 ID
        let user = await User.findOne({ auth0Id });

        if (!user) {
            // User does not exist, create a new one
            // Use the data from the JWT payload to populate the new user
            const newUser = {
                auth0Id,
                name: req.auth.payload.name || req.auth.payload.nickname,
                email: req.auth.payload.email,
            };
            user = await User.create(newUser);
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start the server using the http server instance, not the express app
server.listen(PORT, () => {
    console.log(`Server and WebSocket running on port ${PORT}`);
});
