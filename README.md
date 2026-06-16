
---

# Backend README.md

```md
# 🚀 Real-Time Chat Application - Backend

Backend service powering the Real-Time Chat Application with authentication, real-time communication, and database management.

## 🌐 Live API

https://chat-app-backend-3-ou4r.onrender.com

## 📂 Frontend Repository

https://github.com/Anil-KumarSingh/Chat-app-frontend

## ✨ Features

- User Authentication
- JWT Authorization
- Password Hashing
- Real-Time Communication
- REST APIs
- MongoDB Database Integration
- Secure User Management
- Socket.IO Integration

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Bcrypt.js
- Socket.IO
- CORS
- dotenv

## 📦 Installation

Clone repository:

```bash
git clone https://github.com/Anil-KumarSingh/chat-app-backend.git

Move into project:

cd chat-app-backend

Install dependencies:

npm install

Create .env file:

PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

NODE_ENV=development

Start server:

npm run dev
📡 API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
Messaging
GET /api/messages/:id
POST /api/messages/send/:id
🗄️ Database

MongoDB Atlas

Collections:

Users
Messages
🔧 Deployment

Backend is deployed on Render.

🔐 Security Features
Password Hashing using Bcrypt
JWT Authentication
Protected Routes
Environment Variables
📈 Future Enhancements
Group Chats
Message Encryption
Video Calling
Push Notifications
Media Sharing
👨‍💻 Author

Anil Kumar Singh

LinkedIn:
https://linkedin.com/in/anil-kumar-singh-467144295

GitHub:
https://github.com/Anil-KumarSingh
