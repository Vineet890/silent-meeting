const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: "Workspace name is required." });
        if (name.length > 50) return res.status(400).json({ error: "Workspace name is too long (max 50 characters)." });

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

router.get('/', authenticateToken, async (req, res) => {
    try {
        const workspaces = await Workspace.find({ members: req.user.userId })
            .populate('members', 'name email')
            .populate('pendingInvites', 'name email');
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

router.post('/:id/invite', authenticateToken, async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ error: "Email is required." });

        const workspace = await Workspace.findById(req.params.id);
        
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can invite teammates." });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ error: "User is not registered on the platform yet." });

        if (workspace.members.includes(userToInvite._id)) {
            return res.status(400).json({ error: "User is already a member." });
        }

        if (workspace.pendingInvites.includes(userToInvite._id)) {
            return res.status(400).json({ error: "User is already invited." });
        }

        workspace.pendingInvites.push(userToInvite._id);
        await workspace.save();

        const Notification = require('../models/Notification');
        await Notification.create({
            userId: userToInvite._id,
            type: 'workspace_invite',
            title: 'Workspace Invitation',
            message: `You have been invited to join ${workspace.name}`,
            linkId: workspace._id
        });

        res.status(200).json({ message: "User invited successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to invite teammate" });
    }
});

router.post('/:id/accept-invite', authenticateToken, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        if (!workspace.pendingInvites.includes(req.user.userId)) {
            return res.status(400).json({ error: "No pending invite found." });
        }

        workspace.pendingInvites = workspace.pendingInvites.filter(id => id.toString() !== req.user.userId);
        if (!workspace.members.includes(req.user.userId)) {
            workspace.members.push(req.user.userId);
        }
        await workspace.save();

        res.status(200).json({ message: "Invite accepted!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to accept invite" });
    }
});

router.post('/:id/decline-invite', authenticateToken, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        workspace.pendingInvites = workspace.pendingInvites.filter(id => id.toString() !== req.user.userId);
        await workspace.save();

        res.status(200).json({ message: "Invite declined." });
    } catch (error) {
        res.status(500).json({ error: "Failed to decline invite" });
    }
});

router.delete('/:id/members/:memberId', authenticateToken, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can remove teammates." });
        }

        const memberIdToRemove = req.params.memberId;
        if (workspace.ownerId.toString() === memberIdToRemove) {
            return res.status(400).json({ error: "Owner cannot be removed from the workspace." });
        }

        workspace.members = workspace.members.filter(id => id.toString() !== memberIdToRemove);
        await workspace.save();

        res.status(200).json({ message: "Member removed successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove member" });
    }
});

module.exports = router;
