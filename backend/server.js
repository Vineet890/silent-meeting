const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('./cloudinaryConfig');
const Reply = require('./models/Reply'); 
const Meeting = require('./models/Meeting');

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log("Successfully connected to MongoDB Cloud!"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));

app.get('/api/meetings/:id', async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });
        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meeting" });
    }
});

app.post('/api/meetings', async (req, res) => {
    try {
        const newMeeting = new Meeting({ title: req.body.title, agenda: req.body.agenda });
        const savedMeeting = await newMeeting.save(); 
        res.status(201).json(savedMeeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.get('/api/meetings', async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ createdAt: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

app.get('/api/replies/:meetingId', async (req, res) => {
    try {
        const replies = await Reply.find({ meetingId: req.params.meetingId }).sort({ createdAt: -1 });
        res.status(200).json(replies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/replies', upload.single('video'), async (req, res) => {
    try {
        const { meetingId } = req.body;
        const file = req.file; 

        if (!file) return res.status(400).json({ error: 'No video file provided' });

        console.log("1. Video Caught! Uploading to Cloudinary...");

        let uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    { resource_type: "video", folder: "silent-meeting" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
            });
        };
        const result = await uploadFromBuffer(req);
        console.log("2. Cloudinary Upload complete!");

        console.log("3. Passing video to Groq AI (Whisper) for transcription...");
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, file.buffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3",
            response_format: "text"
        });
        
        fs.unlinkSync(tempFilePath); 
        console.log("Transcript generated!");

        console.log("4. Passing transcript to Llama-3 for summarization...");
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are an executive assistant. Read this meeting transcript and output exactly 3 things: 1. A 1-sentence summary. 2. A bulleted list of Decisions. 3. A bulleted list of Action Items. Keep it extremely short and professional." 
                },
                { role: "user", content: transcription }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const transcriptText = completion.choices[0].message.content;
        console.log("5. AI Analysis complete!\n", transcriptText);

        const newReply = new Reply({
            meetingId: meetingId,
            videoUrl: result.secure_url,
            transcript: transcriptText 
        });

        await newReply.save();
        res.status(201).json(newReply);

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload video" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
});