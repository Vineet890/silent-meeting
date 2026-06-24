const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('./cloudinaryConfig');
const Reply = require('./models/Reply'); 
const Meeting = require('./models/Meeting');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 2. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => {
    console.log("Successfully connected to MongoDB Cloud!");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

app.get('/api/status', (req, res) => {
    res.json({ message: "The Silent Meeting Engine is running perfectly!" });
});

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
        const newMeeting = new Meeting({
            title: req.body.title,
            agenda: req.body.agenda
        });
        
        const savedMeeting = await newMeeting.save(); 
        
        res.status(201).json(savedMeeting);
    } catch (error) {
        console.log("Error saving meeting:", error);
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.get('/api/meetings', async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ createdAt: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        console.log("Error fetching meetings:", error);
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});


const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/replies/:meetingId', async (req, res) => {
    try {
        const replies = await Reply.find({ meetingId: req.params.meetingId }).sort({ createdAt: -1 });
        res.status(200).json(replies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

app.post('/api/replies', upload.single('video'), async (req, res) => {
    try {
        const { meetingId } = req.body;
        const file = req.file; // 

        if (!file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        console.log("Catching video... Uploading to Cloudinary (this takes a few seconds)...");

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
        console.log("✅ Upload complete! Cloud URL:", result.secure_url);

        const newReply = new Reply({
            meetingId: meetingId,
            videoUrl: result.secure_url
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