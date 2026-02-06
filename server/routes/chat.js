import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/chats - Get user's chats
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name year branch')
      .populate('listingId', 'title price images isSold')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = chats.map((c) => {
      const other = c.participants.find((p) => p._id.toString() !== req.user._id.toString());
      return {
        ...c,
        otherUser: other,
        participants: undefined,
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chats.' });
  }
});

// POST /api/chats/start - Start or get existing chat
router.post('/start', protect, async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ message: 'listingId required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    const sellerId = listing.sellerId;
    if (sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself.' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, sellerId] },
      listingId,
    })
      .populate('participants', 'name year branch')
      .populate('listingId', 'title price images isSold');

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, sellerId],
        listingId,
      });
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name year branch')
        .populate('listingId', 'title price images isSold')
        .lean();
    } else {
      chat = chat.toObject ? chat.toObject() : chat;
    }

    const other = chat.participants?.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    res.json({ ...chat, otherUser: other });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start chat.' });
  }
});

// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not part of this chat.' });
    }

    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

// POST /api/chats/:chatId/messages
router.post('/:chatId/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content required.' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not part of this chat.' });
    }

    const message = await Message.create({
      chatId: req.params.chatId,
      senderId: req.user._id,
      content: content.trim().slice(0, 2000),
    });

    chat.lastMessage = {
      content: message.content,
      senderId: req.user._id,
      createdAt: message.createdAt,
    };
    chat.updatedAt = new Date();
    await chat.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name')
      .lean();

    // Emit via Socket.IO (handled in socket handler)
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach((p) => {
        io.to(`user:${p}`).emit('newMessage', populated);
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
