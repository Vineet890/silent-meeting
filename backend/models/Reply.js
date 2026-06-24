const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    meetingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Meeting',
        required: true 
    },
    // We need to know WHO recorded this video!
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoUrl: { 
        type: String,
        required: false
    },
    // We need this to tell Cloudinary exactly which file to delete!
    public_id: {
        type: String,
        required: false
    },
    textContent: { 
        type: String, 
        required: false 
    },
    transcript: {
        type: String,
        required: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Reply', replySchema);