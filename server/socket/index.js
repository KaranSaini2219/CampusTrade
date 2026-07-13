import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// A user room reaches every active device without broadcasting to unrelated sockets.
const activeSocketByUser = new Map();

export function setupSocketIO(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.userId = jwt.verify(token, process.env.JWT_SECRET || 'secret').id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    // Replace stale duplicate connections for the same user to prevent duplicate emits.
    const previousSocketId = activeSocketByUser.get(userId);
    if (previousSocketId && previousSocketId !== socket.id) io.sockets.sockets.get(previousSocketId)?.disconnect(true);
    activeSocketByUser.set(userId, socket.id);
    socket.join(`user:${userId}`);

    socket.on('joinChat', async (chatId) => {
      if (!mongoose.Types.ObjectId.isValid(chatId)) return;
      // Verify membership once before joining; clients cannot subscribe to arbitrary chat rooms.
      const allowed = await Chat.exists({ _id: chatId, participants: userId });
      if (allowed) socket.join(`chat:${chatId}`);
    });

    socket.on('leaveChat', (chatId) => socket.leave(`chat:${chatId}`));

    socket.on('sendMessage', async (data, acknowledgement) => {
      try {
        const chatId = data?.chatId;
        const content = data?.content?.trim().slice(0, 2000);
        if (!mongoose.Types.ObjectId.isValid(chatId) || !content) return acknowledgement?.({ ok: false });
        const chat = await Chat.findOne({ _id: chatId, participants: userId }).select('participants').lean();
        if (!chat) return acknowledgement?.({ ok: false, message: 'Not authorized' });

        const message = await Message.create({ chatId, senderId: userId, content, seenBy: [userId] });
        const otherIds = chat.participants.filter((id) => id.toString() !== userId);
        // Atomic counter update avoids a read-modify-save race for simultaneous messages.
        await Chat.updateOne({ _id: chatId }, {
          $set: { lastMessage: { content: message.content, senderId: userId, createdAt: message.createdAt } },
          $inc: Object.fromEntries(otherIds.map((id) => [`unreadCount.${id}`, 1])),
        });
        // Compose the minimal sender projection; do not re-query solely to populate it.
        const payload = { ...message.toObject(), chatId, senderId: { _id: userId } };
        chat.participants.forEach((id) => io.to(`user:${id}`).emit('newMessage', payload));
        acknowledgement?.({ ok: true, message: payload });
      } catch (err) {
        acknowledgement?.({ ok: false, message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      if (activeSocketByUser.get(userId) === socket.id) activeSocketByUser.delete(userId);
    });
  });
}
