<div align="center">
  <img src="https://raw.githubusercontent.com/Vineet890/syncloop/main/frontend/public/vite.svg" alt="SyncLoop Logo" width="80" height="80" />
  <h1>SyncLoop ⚡</h1>
  <p><strong>The asynchronous video communication platform built for high-performance, distributed teams.</strong></p>
  
  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white" alt="React 19" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io&logoColor=white" alt="Socket.io" /></a>
  </p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#security--architecture">Security</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

**SyncLoop** replaces endless live meetings with structured, asynchronous video threads. Record your updates, watch them on your own time, and let **Groq AI** automatically transcribe and summarize the key takeaways. Designed with a premium, fluid UI to make team collaboration effortless and beautiful.

---

## ✨ Features

- 📹 **Asynchronous Video Threads:** Record webcam and screen updates directly from the browser. Watch replies in context without scheduling nightmares.
- 🤖 **Groq AI Integration:** Every video is automatically transcribed using `whisper-large-v3` and summarized with `llama-3.3-70b-versatile` for instant context.
- 💬 **Meeting Chat AI:** Talk directly to your meetings. Ask the AI questions like *"What was the consensus on the new design?"* or *"List my action items"*.
- 🏢 **Secure Workspaces:** Create private team workspaces, invite members, and maintain strict role-based access to meeting threads.
- 🧵 **Threaded Discussions:** Engage in deeply nested text comments on specific video replies to keep conversations organized.
- 📬 **Email Notifications:** Automated email alerts keep your team in the loop when new updates are posted.
- 🎨 **Premium UI/UX:** Built with Tailwind CSS, featuring a sleek glassmorphism aesthetic, dynamic animations, and an immersive user experience.
- 🌙 **Dark Mode:** Native, flicker-free dark mode support for late-night productivity.

---

## 🔒 Security & Architecture

SyncLoop is built from the ground up with **enterprise-grade security** and a modern, decoupled architecture. 

### Security Highlights
- **Zero Trust Architecture:** All WebSockets (Socket.io) and REST API routes are fully secured with JWT authentication and rigorous workspace-membership validation.
- **Attack Prevention:** Defended against NoSQL Injection, ReDoS, XSS, and Clickjacking via aggressive input sanitization, strict Mongoose schema limits, and `helmet` headers.
- **DDoS Mitigation:** Layered rate-limiting strategy (Global 200/15m, Auth 10/15m) and strict JSON body payload size limits.
- **Cost Control:** Cloudinary video assets are automatically and securely destroyed upon user account or video deletion.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v3 + Lucide Icons + Glassmorphism UI
- **State Management:** React Hooks + Context + LocalStorage
- **Data Visualization:** Recharts
- **Real-time Engine:** Socket.io-client

### Backend
- **Server:** Node.js + Express.js
- **Database:** MongoDB Atlas + Mongoose
- **Authentication:** JWT + bcryptjs
- **Security:** Helmet + express-rate-limit
- **Media Storage:** Cloudinary Video CDN + streamifier
- **AI Processing:** Groq SDK (Whisper & LLaMA)
- **Testing:** Jest + Supertest

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI
- Cloudinary Account
- Groq API Key

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/Vineet890/syncloop.git
cd syncloop
```

**2. Setup Backend**
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=http://localhost:5173
```
Start the backend server:
```bash
npm start
```

**3. Setup Frontend**
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🧪 Testing

The backend includes a comprehensive Jest test suite covering authentication, authorization, and core application logic to ensure zero regressions.

```bash
cd backend
npm run test
```

---

## 📦 Deployment

SyncLoop is fully configured for modern PaaS deployment.

- **Frontend (Vercel):** Build via Vite. Ensure the `VITE_API_URL` environment variable points to your live backend server URL.
- **Backend (Render):** Standard Node.js backend. Ensure all environment variables (including `CORS_ORIGIN` pointing to your deployed frontend URL) are securely injected.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Vineet890">Vineet Kumar</a>.
</div>
