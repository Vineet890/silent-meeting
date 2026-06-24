const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Groq = require('groq-sdk');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import Models
const Meeting = require('./models/Meeting');
const Reply = require('./models/Reply');
const User = require('./models/User');
const Workspace = require('./models/Workspace');

const app = express();
app.use(cors());
app.use(express.json()); 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_123';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Cloud!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configure Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configure Multer
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// WebSockets
io.on('connection', (socket) => {
    socket.on('join_meeting', (meetingId) => {
        socket.join(meetingId);
    });
    socket.on('disconnect', () => {});
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access Denied" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user; 
        next();
    });
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        const savedUser = await newUser.save();

        const defaultWorkspace = new Workspace({
            name: `${savedUser.name}'s Workspace`,
            ownerId: savedUser._id,
            members: [savedUser._id]
        });
        await defaultWorkspace.save();

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
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// --- WORKSPACE ROUTES ---

app.get('/api/workspaces', authenticateToken, async (req, res) => {
    try {
        const userWorkspaces = await Workspace.find({ members: req.user.userId });
        res.status(200).json(userWorkspaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

app.post('/api/workspaces/invite', authenticateToken, async (req, res) => {
    try {
        const { workspaceId, email } = req.body;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the workspace owner can invite members" });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ error: "User not found. Tell them to register first!" });

        if (workspace.members.includes(userToInvite._id)) {
            return res.status(400).json({ error: "User is already in this workspace" });
        }

        workspace.members.push(userToInvite._id);
        await workspace.save();
        res.status(200).json({ message: `Successfully added ${userToInvite.name} to the workspace!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to invite teammate" });
    }
});

// --- MEETING ROUTES ---

app.get('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (workspaceId) {
            const meetings = await Meeting.find({ workspaceId: workspaceId }).sort({ createdAt: -1 });
            return res.status(200).json(meetings);
        }
        const userWorkspaces = await Workspace.find({ members: req.user.userId });
        const workspaceIds = userWorkspaces.map(ws => ws._id);
        const meetings = await Meeting.find({ workspaceId: { $in: workspaceIds } }).sort({ createdAt: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

app.post('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const userWorkspace = await Workspace.findOne({ members: req.user.userId });
        const newMeeting = new Meeting({ 
            title: req.body.title, 
            agenda: req.body.agenda,
            workspaceId: req.body.workspaceId || userWorkspace._id 
        });
        const savedMeeting = await newMeeting.save(); 
        res.status(201).json(savedMeeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.get('/api/meetings/:id', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        // We also pass the Workspace back so the frontend can check who the owner is!
        const workspace = await Workspace.findById(meeting.workspaceId);
        const replies = await Reply.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
        res.status(200).json({ meeting, replies, workspace });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meeting details" });
    }
});

// NEW: Close a Meeting
app.put('/api/meetings/:id/close', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the workspace owner can close meetings" });
        }

        meeting.status = "Closed";
        await meeting.save();
        
        io.to(req.params.id).emit('meeting_closed', meeting);
        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to close meeting" });
    }
});

// NEW: RAG AI Chatbot Route!
app.post('/api/meetings/:id/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        // 1. RETRIEVAL: Fetch every single video reply from this meeting
        const replies = await Reply.find({ meetingId: req.params.id });
        
        // 2. AUGMENTATION: Glue all the video transcripts together into one giant String!
        const allTranscripts = replies
            .filter(r => r.transcript) // Only grab videos that successfully generated text
            .map(r => r.transcript)
            .join('\n\n---\n\n');

        if (!allTranscripts) {
            return res.status(200).json({ answer: "There are no video transcripts in this meeting yet for me to read!" });
        }

        // 3. GENERATION: Send the giant String and the User's question to Groq!
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

        // 4. Send the AI's answer back to the frontend!
        const aiAnswer = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
        res.status(200).json({ answer: aiAnswer });

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
});

// --- REPLY (VIDEO) ROUTES ---

app.post('/api/replies', authenticateToken, upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No video file provided" });

    try {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "video", folder: "silent-meetings" },
            async (error, result) => {
                if (error) return res.status(500).json({ error: "Cloudinary upload failed" });

                const tempFilePath = `./temp_${Date.now()}.webm`;
                fs.writeFileSync(tempFilePath, req.file.buffer);

                let transcriptText = "";
                let summaryText = "No summary available.";

                try {
                    const transcription = await groq.audio.transcriptions.create({
                        file: fs.createReadStream(tempFilePath),
                        model: "whisper-large-v3",
                        response_format: "json",
                    });
                    transcriptText = transcription.text;
                    
                    if (transcriptText) {
                        const chatCompletion = await groq.chat.completions.create({
                            messages: [
                                { role: "system", content: "You are an AI assistant. Summarize the following meeting transcript in 1 sentence. Then list any action items." },
                                { role: "user", content: transcriptText }
                            ],
                            model: "llama-3.3-70b-versatile",
                        });
                        summaryText = chatCompletion.choices[0]?.message?.content || summaryText;
                    }
                } catch (aiError) {
                    console.error("AI Processing Error:", aiError);
                    summaryText = "AI Processing failed.";
                }

                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

                // Update: We now save the userId and public_id!
                const newReply = new Reply({
                    meetingId: req.body.meetingId,
                    userId: req.user.userId,
                    videoUrl: result.secure_url,
                    public_id: result.public_id,
                    transcript: transcriptText,
                    textContent: summaryText
                });
                await newReply.save();

                io.to(req.body.meetingId).emit('new_reply', newReply);
                res.status(201).json(newReply);
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (error) {
        res.status(500).json({ error: "Failed to upload video" });
    }
});

// NEW: Delete a Video
app.delete('/api/replies/:id', authenticateToken, async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.id);
        if (!reply) return res.status(404).json({ error: "Reply not found" });

        // Security check: Only the person who recorded the video can delete it!
        if (reply.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "You can only delete your own videos" });
        }

        // Delete from Cloudinary to save money!
        if (reply.public_id) {
            await cloudinary.uploader.destroy(reply.public_id, { resource_type: 'video' });
        }

        // Delete from MongoDB
        await Reply.findByIdAndDelete(req.params.id);

        io.to(reply.meetingId.toString()).emit('reply_deleted', req.params.id);
        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete video" });
    }
});

server.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
});