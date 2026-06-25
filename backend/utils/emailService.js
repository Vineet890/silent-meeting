const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendNotificationEmail(targetEmails, workspaceName, meetingTitle, uploaderName, aiSummary) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

        await transporter.sendMail({
            from: `"Async Sync Notifications" <${process.env.EMAIL_USER}>`,
            bcc: targetEmails.join(','), // Bcc so teammates don't see everyone's private email address
            subject: `New Video in ${workspaceName}: ${meetingTitle}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #c084fc;">New Update in ${workspaceName}</h2>
                    <p><strong>${uploaderName}</strong> just recorded a new video in the <strong>${meetingTitle}</strong> thread.</p>
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #10b981;">✨ AI Summary</h4>
                        <p style="margin-bottom: 0;">${aiSummary}</p>
                    </div>
                    <p>Log in to Async Sync to watch the full video and reply!</p>
                </div>
            `,
        });

        console.log("✉️ REAL EMAIL SUCCESSFULLY SENT TO:", targetEmails);
    } catch (error) {
        console.error("Failed to send real email:", error);
    }
}

module.exports = sendNotificationEmail;