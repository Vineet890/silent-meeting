const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
const Reply = require('../models/Reply');
const groq = require('../config/groq');
let io;

router.setSocketIo = (socketIo) => { io = socketIo; };

router.post('/', authenticateToken, async (req, res) => {
    try {
        let { title, agenda, workspaceId } = req.body;
        
        title = String(title || '').trim();
        agenda = String(agenda || '').trim();
        
        if (!title) return res.status(400).json({ error: "Title is required" });
        if (title.length > 100) return res.status(400).json({ error: "Title is too long (max 100 characters)" });
        if (agenda.length > 2000) return res.status(400).json({ error: "Agenda is too long (max 2000 characters)" });

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the workspace owner can create meetings." });
        }

        const newMeeting = new Meeting({ 
            title, 
            agenda, 
            workspaceId,
            allowedUsers: [req.user.userId]
        });
        await newMeeting.save();
        res.status(201).json(newMeeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { workspaceId, page = 1, limit = 20 } = req.query;
        if (!workspaceId) return res.status(400).json({ error: "Workspace ID is required" });
        
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skipNum = (pageNum - 1) * limitNum;

        const meetings = await Meeting.find({ workspaceId })
            .sort({ createdAt: -1 })
            .skip(skipNum)
            .limit(limitNum);
            
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });

        const workspace = await Workspace.findById(meeting.workspaceId).populate('members', 'name email');
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        const isAllowed = meeting.allowedUsers.some(userId => userId.toString() === req.user.userId);
        if (!isAllowed) {
            return res.status(403).json({ error: "Access Denied: You must be invited by the creator to view this thread." });
        }

        const replies = await Reply.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
        res.status(200).json({ meeting, replies, workspace });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meeting details" });
    }
});

router.put('/:id/close', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found." });

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found." });
        
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can close a meeting." });
        }

        meeting.status = 'Closed';
        await meeting.save();

        if (io) io.to(req.params.id).emit('meeting_closed', meeting);

        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to close meeting" });
    }
});

router.post('/:id/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const meetingId = req.params.id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        const isMember = workspace.members.some(memberId => memberId.toString() === req.user.userId);
        if (!isMember) {
            return res.status(403).json({ error: "You do not have access to chat with this meeting's AI." });
        }

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

router.post('/:id/add-user', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (workspace.ownerId.toString() !== req.user.userId && !meeting.allowedUsers.includes(req.user.userId)) {
            return res.status(403).json({ error: "Only members of this meeting can invite others." });
        }

        if (meeting.allowedUsers.includes(userId)) {
            return res.status(400).json({ error: "User is already in this meeting." });
        }

        meeting.allowedUsers.push(userId);
        await meeting.save();

        const Notification = require('../models/Notification');
        await Notification.create({
            userId,
            type: 'meeting_invite',
            title: 'Added to Thread',
            message: `You were added to the discussion: ${meeting.title}`,
            linkId: meeting._id
        });

        res.status(200).json({ message: "User added to meeting successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to add user to meeting" });
    }
});

router.delete('/:id/remove-user', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });

        const workspace = await Workspace.findById(meeting.workspaceId);
        // Only workspace owner or meeting creator can remove (assuming creator is the only one managing, or owner)
        if (workspace.ownerId.toString() !== req.user.userId && !meeting.allowedUsers.includes(req.user.userId)) {
            return res.status(403).json({ error: "Only members of this meeting can manage access." });
        }

        meeting.allowedUsers = meeting.allowedUsers.filter(id => id.toString() !== userId);
        await meeting.save();

        res.status(200).json({ message: "User removed from meeting successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove user from meeting" });
    }
});

module.exports = router;
