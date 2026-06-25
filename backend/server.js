require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const Groq = require('groq-sdk');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Database Models
const Meeting = require('./models/Meeting');
const Reply = require('./models/Reply');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Comment = require('./models/Comment');

// Email Service
const sendNotificationEmail = require('./utils/emailService');

const app = express();
const server = http.createServer(app);

// WebSockets Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Groq Configuration
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Cloud!'))
  .catch(err => console.error('MongoDB connection error:', err));


// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user; 
        next();
    });
};


// --- WEBSOCKET CONNECTION ---
io.on('connection', (socket) => {
    socket.on('join_meeting', (meetingId) => {
        socket.join(meetingId);
    });
});


// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        const savedUser = await newUser.save();

        const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});


// --- WORKSPACE ROUTES ---
app.post('/api/workspaces', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const newWorkspace = new Workspace({
            name,
            ownerId: req.user.userId,
            members: [req.user.userId] 
        });
        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (error) {
        res.status(500).json({ error: "Failed to create workspace" });
    }
});

app.get('/api/workspaces', authenticateToken, async (req, res) => {
    try {
        const workspaces = await Workspace.find({ members: req.user.userId });
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

app.post('/api/workspaces/:id/invite', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;
        const workspace = await Workspace.findById(req.params.id);
        
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can invite teammates." });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ error: "User is not registered on the platform yet." });

        if (!workspace.members.includes(userToInvite._id)) {
            workspace.members.push(userToInvite._id);
            await workspace.save();
        }
        res.status(200).json({ message: "User added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to invite teammate" });
    }
});


// --- MEETING ROUTES ---
app.post('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const { title, agenda, workspaceId } = req.body;
        const newMeeting = new Meeting({ title, agenda, workspaceId });
        await newMeeting.save();
        res.status(201).json(newMeeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.get('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) return res.status(400).json({ error: "Workspace ID is required" });
        
        const meetings = await Meeting.find({ workspaceId }).sort({ createdAt: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

app.get('/api/meetings/:id', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        const replies = await Reply.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
        const workspace = await Workspace.findById(meeting.workspaceId);
        res.status(200).json({ meeting, replies, workspace });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meeting details" });
    }
});

app.put('/api/meetings/:id/close', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        const workspace = await Workspace.findById(meeting.workspaceId);
        
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can close a meeting." });
        }

        meeting.status = 'Closed';
        await meeting.save();

        io.to(req.params.id).emit('meeting_closed', meeting);

        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to close meeting" });
    }
});

app.post('/api/meetings/:id/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const meetingId = req.params.id;

        const replies = await Reply.find({ meetingId });
        const allTranscripts = replies.map(r => r.transcript).join('\n---\n');

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { 
                  role: "system", 
                  content: `You are a strict, highly accurate AI Executive Assistant. Use ONLY the following meeting transcripts. When drafting emails or listing action items, you MUST explicitly include the names of the assignees exactly as they appear in the transcript. Do not make assumptions about who the client is, use generic placeholders like [Client Name] if it is not explicitly stated.\n\nTranscripts:\n${allTranscripts}` 
                },
                { 
                  role: "user", 
                  content: message 
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        res.status(200).json({ answer: chatCompletion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Failed to chat with meeting AI" });
    }
});


// --- VIDEO UPLOAD MULTIPART CONFIG ---
const upload = multer();

// --- VIDEO ROUTES ---
app.post('/api/replies', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        const meetingId = req.body.meetingId;
        
        let uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'video' },
                    (error, result) => {
                        if (result) { resolve(result); } else { reject(error); }
                    }
                );
                streamifier.createReadStream(buffer).pipe(cld_upload_stream);
            });
        };

        const result = await uploadFromBuffer(req.file.buffer);

        const tempFilePath = `./temp_${Date.now()}.webm`;
        fs.writeFileSync(tempFilePath, req.file.buffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3",
            response_format: "verbose_json",
        });

        const transcriptText = transcription.text;
        fs.unlinkSync(tempFilePath);

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { 
                  role: "system", 
                  content: "You are an AI meeting assistant. Summarize the following transcript in 1 sentence. Then, if there are any tasks mentioned, list them as action items below." 
                },
                { 
                  role: "user", 
                  content: transcriptText 
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const summaryText = chatCompletion.choices[0].message.content;

        const newReply = new Reply({
            meetingId: meetingId,
            userId: req.user.userId,
            videoUrl: result.secure_url,
            public_id: result.public_id, 
            transcript: transcriptText,
            textContent: summaryText
        });

        await newReply.save();

        // --- NEW: EMAIL NOTIFICATIONS ---
        try {
            const meeting = await Meeting.findById(meetingId);
            if (meeting) {
                const workspace = await Workspace.findById(meeting.workspaceId);
                if (workspace) {
                    const uploader = await User.findById(req.user.userId);
                    const teammates = await User.find({
                        _id: { $in: workspace.members, $ne: req.user.userId }
                    });
                    
                    if (teammates.length > 0) {
                        const targetEmails = teammates.map(u => u.email);
                        sendNotificationEmail(targetEmails, workspace.name, meeting.title, uploader.name, summaryText);
                    }
                }
            }
        } catch (emailErr) {
            console.error("Error sending notifications:", emailErr);
        }

        io.to(meetingId).emit('new_reply', newReply);
        res.status(201).json(newReply);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to process video reply" });
    }
});

app.delete('/api/replies/:id', authenticateToken, async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.id);
        
        if (reply.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "You can only delete your own videos." });
        }

        if (reply.public_id) {
            await cloudinary.uploader.destroy(reply.public_id, { resource_type: 'video' });
        }

        await Reply.findByIdAndDelete(req.params.id);
        io.to(reply.meetingId.toString()).emit('reply_deleted', req.params.id);

        res.status(200).json({ message: "Video completely destroyed!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete video" });
    }
});


// --- COMMENT ROUTES ---
app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { replyId, text, parentCommentId } = req.body;
        const user = await User.findById(req.user.userId);
        
        const newComment = new Comment({
            replyId,
            userId: req.user.userId,
            userName: user.name || "Teammate", 
            text,
            parentCommentId: parentCommentId || null 
        });
        
        await newComment.save();

        const reply = await Reply.findById(replyId);
        if (reply) {
            io.to(reply.meetingId.toString()).emit('new_comment', newComment);
        }

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: "Failed to post comment" });
    }
});

app.get('/api/comments/:replyId', authenticateToken, async (req, res) => {
    try {
        const comments = await Comment.find({ replyId: req.params.replyId }).sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});


// --- GLOBAL SEARCH ROUTE ---
app.get('/api/search', authenticateToken, async (req, res) => {
    try {
        const { q, workspaceId } = req.query;
        if (!q || !workspaceId) return res.status(400).json({ error: "Missing query or workspace" });

        const meetingMatches = await Meeting.find({
            workspaceId: workspaceId,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { agenda: { $regex: q, $options: 'i' } }
            ]
        });

        const replyMatches = await Reply.find({
            transcript: { $regex: q, $options: 'i' }
        });

        const replyMeetingIds = replyMatches.map(r => r.meetingId);
        const additionalMeetings = await Meeting.find({
            _id: { $in: replyMeetingIds },
            workspaceId: workspaceId
        });

        const allMatches = [...meetingMatches, ...additionalMeetings];
        const uniqueMeetings = Array.from(new Set(allMatches.map(m => m._id.toString())))
            .map(id => allMatches.find(m => m._id.toString() === id));

        uniqueMeetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json(uniqueMeetings);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
});


// --- ANALYTICS ROUTE ---
app.get('/api/analytics/:workspaceId', authenticateToken, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        
        const totalMeetings = await Meeting.countDocuments({ workspaceId });
        
        const meetings = await Meeting.find({ workspaceId }).select('_id');
        const meetingIds = meetings.map(m => m._id);
        const totalVideos = await Reply.countDocuments({ meetingId: { $in: meetingIds } });

        const workspace = await Workspace.findById(workspaceId);
        const totalMembers = workspace.members.length;

        res.status(200).json({
            totalMeetings,
            totalVideos,
            totalMembers
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});


// --- SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
});