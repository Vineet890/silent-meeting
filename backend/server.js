require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const Meeting = require('./models/Meeting');
const Workspace = require('./models/Workspace');

const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const replyRoutes = require('./routes/replyRoutes');
const commentRoutes = require('./routes/commentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// WebSockets Setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Security Headers
app.use(helmet());

// CORS — use env variable for production
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));

// Body parsing with size limits to prevent payload attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Rate Limiter — MUST be before routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use('/api', globalLimiter);

// Initialize Database
connectDB();

// Pass socket.io instance to routes that need it
meetingRoutes.setSocketIo(io);
replyRoutes.setSocketIo(io);
commentRoutes.setSocketIo(io);

// Socket.io Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error"));
    }
    jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key', (err, decoded) => {
        if (err) return next(new Error("Authentication error"));
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    socket.on('join_meeting', async (meetingId) => {
        try {
            const meeting = await Meeting.findById(meetingId);
            if (!meeting) return;

            const workspace = await Workspace.findById(meeting.workspaceId);
            if (!workspace) return;

            const isMember = workspace.members.some(m => m.toString() === socket.user.userId);
            if (isMember) {
                socket.join(meetingId);
            }
        } catch (err) {
            console.error("Socket join error:", err);
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Note: Global rate limiter is applied above, before routes

// Health Check Endpoint (For Cron Jobs / Keep-Alive Pingers)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler caught:", err.stack);
    res.status(500).json({ error: "An unexpected internal server error occurred." });
});

// Server Start
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server is running live on http://localhost:${PORT}`);
    });
}

module.exports = { app, server };