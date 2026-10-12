# Aao Baat kren!! — Backend

Express and Socket.IO API for the [Aao Baat kren!! frontend](https://github.com/Anil-KumarSingh/chat-app-frontend). Uses MongoDB for users and direct message history, JWT for authentication, and Socket.IO for live chat and presence.

## Links

- **Live API:** https://chat-app-backend-3-ou4r.onrender.com
- **Frontend repository:** https://github.com/Anil-KumarSingh/chat-app-frontend

## Features and stack

- User registration, user/admin authentication, and protected routes.
- Password hashing with bcryptjs and signed JWT sessions.
- MongoDB persistence for accounts and direct messages.
- Socket.IO messaging, typing indicators, and multi-socket online presence.
- Node.js, Express, Socket.IO, Mongoose, MongoDB, JWT, bcryptjs, and dotenv.

## Requirements

- Node.js 22 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string

## Local setup

```bash
npm install
```

Create `.env` using `.env.example` as a template:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Start MongoDB, then start the backend:

```bash
npm run dev
```

The API and Socket.IO server listen at `http://localhost:5000`. Check `http://localhost:5000/health` for server and database status. Use `npm start` to run without nodemon.

## Create or update an admin

Set these private values in `.env.local` (ignored by Git):

```env
ADMIN_NAME=Chat Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-unique-password-at-least-12-characters-long
```

Then run:

```bash
npm run create-admin
```

Use that account at the frontend's `/admin/login` page. To update it, change these values and run the command again. Never commit real credentials or secrets.

## API routes

Protected endpoints require `Authorization: Bearer <token>`.

| Method | Route | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a regular user | Public |
| `POST` | `/api/auth/login` | Regular user login | Public |
| `POST` | `/api/auth/admin-login` | Admin login | Public |
| `GET` | `/api/users/conversations` | Saved contacts and existing chats | User |
| `GET` | `/api/users/search?q=<query>` | Find accounts by username, email, or phone | User |
| `POST` | `/api/users/contacts` | Save a contact (`{ "userId": "..." }`) | User |
| `PATCH` | `/api/users/me/phone` | Update the signed-in user's phone | User |
| `GET` | `/api/messages/:userId` | Get direct message history | User |
| `POST` | `/api/messages` | Save a direct message over HTTP | User |
| `GET` | `/api/admin/users` | List accounts | Admin |
| `GET` | `/health` | Health check | Public |

## Socket.IO events

Sockets authenticate with a JWT in `socket.handshake.auth.token`.

- Client to server: `join`, `sendMessage` (`{ receiverId, message }`), `typing` (`{ receiverId }`), `stopTyping` (`{ receiverId }`).
- Server to client: `receiveMessage`, `onlineUsers` (full user ID snapshot), `userOnline`, `userOffline`, `typing` (`{ senderId }`), `stopTyping` (`{ senderId }`).

Presence tracks multiple active sockets for each account within a backend process. If deploying multiple backend instances, configure a shared Socket.IO adapter to share presence and socket events between instances.

## Deployment configuration

Set `MONGO_URI`, a strong unique `JWT_SECRET`, and `CLIENT_URL` or comma-separated `CLIENT_URLS` in the hosting provider. The client origin must match the deployed frontend. Configure admin credentials privately and run `npm run create-admin` against the intended database.

Do not commit `.env`, `.env.local`, MongoDB credentials, JWT secrets, or admin passwords. `.env.example` contains placeholders only.

## Author

Anil Kumar Singh

- GitHub: https://github.com/Anil-KumarSingh
- LinkedIn: https://linkedin.com/in/Anil-Kumar-Singh-467144295
