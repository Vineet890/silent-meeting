const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const groq = require('../config/groq');
const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
const Reply = require('../models/Reply');
const User = require('../models/User');
const sendNotificationEmail = require('../utils/emailService');
let io;

const tempDir = os.tmpdir();
const upload = multer({ dest: tempDir });
router.setSocketIo = (socketIo) => { io = socketIo; };

router.post('/', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        const meetingId = req.body.meetingId;
        
        // Validate file exists
        if (!req.file) {
            return res.status(400).json({ error: "No video file provided." });
        }

        // Authorize: verify user is member of the workspace that owns this meeting
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ error: "Meeting not found." });

        if (meeting.status === 'Closed') {
            return res.status(403).json({ error: "This meeting is locked. No new videos can be uploaded." });
        }

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found." });

        const isMember = workspace.members.some(m => m.toString() === req.user.userId);
        if (!isMember) {
            return res.status(403).json({ error: "You do not have access to this meeting." });
        }

        const tempFilePath = req.file.path;
        let result;
        let transcriptText = "";
        let summaryText = "";

        try {
            let uploadFromFile = (filePath) => {
                return new Promise((resolve, reject) => {
                    let cld_upload_stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'video' },
                        (error, result) => {
                            if (result) { resolve(result); } else { reject(error); }
                        }
                    );
                    fs.createReadStream(filePath).pipe(cld_upload_stream);
                });
            };

            result = await uploadFromFile(tempFilePath);

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-large-v3",
                response_format: "verbose_json",
            });

            transcriptText = transcription.text;

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

            summaryText = chatCompletion.choices[0].message.content;
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }

        const newReply = new Reply({
            meetingId: meetingId,
            userId: req.user.userId,
            videoUrl: result.secure_url,
            public_id: result.public_id, 
            transcript: transcriptText,
            textContent: summaryText
        });

        await newReply.save();

        try {
            const meeting = await Meeting.findById(meetingId);
            if (meeting) {
                const workspace = await Workspace.findById(meeting.workspaceId);
                if (workspace) {
                    const uploader = await User.findById(req.user.userId);
                    
                    const Notification = require('../models/Notification');
                    const notificationsToCreate = [];
                    const targetEmails = [];

                    for (const memberId of meeting.allowedUsers) {
                        if (memberId.toString() !== req.user.userId) {
                            notificationsToCreate.push({
                                userId: memberId,
                                type: 'new_reply',
                                title: 'New Video Uploaded',
                                message: `${uploader.name} posted a new update in "${meeting.title}"`,
                                linkId: meeting._id
                            });
                        }
                    }

                    if (notificationsToCreate.length > 0) {
                        await Notification.insertMany(notificationsToCreate);
                        
                        // We also still want to send the email to allowed users
                        const teammates = await User.find({
                            _id: { $in: meeting.allowedUsers, $ne: req.user.userId }
                        });
                        teammates.forEach(u => targetEmails.push(u.email));
                        
                        sendNotificationEmail(targetEmails, workspace.name, meeting.title, uploader.name, summaryText);
                    }
                }
            }
        } catch (err) {
            console.error("Error creating notifications:", err);
        }

        if (io) io.to(meetingId).emit('new_reply', newReply);
        res.status(201).json(newReply);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to process video reply" });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.id);
        if (!reply) return res.status(404).json({ error: "Video not found." });
        
        if (reply.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "You can only delete your own videos." });
        }

        if (reply.public_id) {
            await cloudinary.uploader.destroy(reply.public_id, { resource_type: 'video' });
        }

        const Comment = require('../models/Comment');
        await Comment.deleteMany({ replyId: req.params.id });

        await Reply.findByIdAndDelete(req.params.id);
        
        if (io) io.to(reply.meetingId.toString()).emit('reply_deleted', req.params.id);

        res.status(200).json({ message: "Video completely destroyed!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete video" });
    }
});

module.exports = router;
