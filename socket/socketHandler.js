const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Keeps track of currently connected users: userId -> socketId
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Middleware: authenticate every socket connection using the JWT token
  // sent by the client in the `auth` field during connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Socket connected: user=${socket.userId}, socket=${socket.id}`);

    // Track the user as online
    onlineUsers.set(socket.userId, socket.id);

    // Join a personal room named after the user's ID so we can
    // send messages directly to this user from anywhere
    socket.join(socket.userId);

    // Update user's online status in the database
    try {
      await User.findByIdAndUpdate(socket.userId, { onlineStatus: true });
    } catch (err) {
      console.error('Failed to update online status:', err.message);
    }

    // Notify everyone that this user is now online
    io.emit('userOnline', socket.userId);

    // --- CLIENT EVENT: join ---
    // Client explicitly joins their personal room (kept for clarity / re-join scenarios)
    socket.on('join', () => {
      socket.join(socket.userId);
    });

    // --- CLIENT EVENT: sendMessage ---
    // Save the message to MongoDB and emit it to both sender and receiver
    socket.on('sendMessage', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message || !message.trim()) return;

        const newMessage = await Message.create({
          senderId: socket.userId,
          receiverId,
          message: message.trim(),
        });

        // Emit to the receiver's room (if they are connected, they receive it instantly)
        io.to(receiverId).emit('receiveMessage', newMessage);

        // Emit back to the sender's room (so all of sender's open tabs sync)
        io.to(socket.userId).emit('receiveMessage', newMessage);
      } catch (error) {
        console.error('sendMessage error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to send message' });
      }
    });

    // --- CLIENT EVENT: typing ---
    // Notify the receiver that this user is typing
    socket.on('typing', ({ receiverId }) => {
      if (!receiverId) return;
      io.to(receiverId).emit('typing', { senderId: socket.userId });
    });

    // --- CLIENT EVENT: stopTyping ---
    // Notify the receiver that this user stopped typing
    socket.on('stopTyping', ({ receiverId }) => {
      if (!receiverId) return;
      io.to(receiverId).emit('stopTyping', { senderId: socket.userId });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: user=${socket.userId}`);
      onlineUsers.delete(socket.userId);

      try {
        await User.findByIdAndUpdate(socket.userId, { onlineStatus: false });
      } catch (err) {
        console.error('Failed to update offline status:', err.message);
      }

      // Notify everyone that this user went offline
      io.emit('userOffline', socket.userId);
    });
  });
};

module.exports = socketHandler;
