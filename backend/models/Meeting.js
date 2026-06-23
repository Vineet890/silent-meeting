const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    agenda: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'Open' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);