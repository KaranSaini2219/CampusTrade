import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

const userSockets = new Map(); // userId -> Set of socketIds

export function setupSocketIO(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    socket.on('joinChat', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;
        if (!chatId || !content?.trim()) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;
        if (!chat.participants.some((p) => p.toString() === userId)) return;

        const message = await Message.create({
          chatId,
          senderId: userId,
          content: content.trim().slice(0, 2000),
        });

        chat.lastMessage = {
          content: message.content,
          senderId: userId,
          createdAt: message.createdAt,
        };
        chat.updatedAt = new Date();
        await chat.save();

        const populated = await Message.findById(message._id)
          .populate('senderId', 'name')
          .lean();

        io.to(`chat:${chatId}`).emit('newMessage', populated);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
  });
}
