import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendNewConversationEmail } from '../utils/email.js';

const router = express.Router();
const DEFAULT_MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 100;

function sortParticipants(participants) {
  return [...participants].sort((a, b) => a.toString().localeCompare(b.toString()));
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/chats - load only fields needed by the inbox.
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .select('participants listingId lastMessage unreadCount createdAt updatedAt')
      .populate('participants', 'name isBanned')
      .populate('listingId', 'title isSold')
      .sort({ updatedAt: -1 })
      .lean();

    const currentUserId = req.user._id.toString();
    // Filter populated banned/deleted users before serialization; no extra user query.
    const formatted = chats.reduce((result, chat) => {
      const other = chat.participants.find((participant) => participant?._id?.toString() !== currentUserId);
      if (!other || other.isBanned) return result;
      result.push({
        _id: chat._id,
        otherUser: other,
        listingId: chat.listingId,
        lastMessage: chat.lastMessage,
        // lean() returns Maps as plain objects.
        unreadCount: chat.unreadCount?.[currentUserId] || 0,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
      return result;
    }, []);
    res.json({ chats: formatted });
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ message: 'Failed to fetch chats.' });
  }
});

// GET /api/chats/avatars - deferred to keep the primary inbox payload small.
router.get('/avatars', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id }).select('participants').lean();
    const currentUserId = req.user._id.toString();
    const otherUserIds = [...new Set(chats.flatMap((chat) => chat.participants)
      .map(String).filter((id) => id !== currentUserId))];
    const usersWithPictures = await User.find(
      { _id: { $in: otherUserIds }, profilePicture: { $ne: null } },
      'profilePicture'
    ).lean();
    res.json({ profilePictures: Object.fromEntries(usersWithPictures.map((user) => [user._id, user.profilePicture])) });
  } catch (err) {
    console.error('Error fetching chat avatars:', err);
    res.status(500).json({ message: 'Failed to fetch chat avatars.' });
  }
});

// POST /api/chats/start - atomically create or retrieve the one chat for a listing/user pair.
router.post('/start', protect, async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Listing ID is required.' });
    if (!isValidId(listingId)) return res.status(400).json({ message: 'Invalid listing ID format.' });

    const listing = await Listing.findById(listingId).select('title sellerId isSold').lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (!listing.sellerId) return res.status(400).json({ message: 'This listing has no seller.' });

    const sellerId = listing.sellerId.toString();
    const currentUserId = req.user._id.toString();
    if (sellerId === currentUserId) {
      return res.status(400).json({ message: 'You cannot chat with yourself about your own listing.' });
    }
    const participants = sortParticipants([currentUserId, sellerId]);

    // Seller validation and exact-array unique-index upsert run concurrently.
    const [seller, upsertResult] = await Promise.all([
      User.findById(sellerId).select('name email isBanned').lean(),
      Chat.findOneAndUpdate(
        { participants, listingId },
        { $setOnInsert: { participants, listingId, unreadCount: { [participants[0]]: 0, [participants[1]]: 0 } } },
        { new: true, upsert: true, setDefaultsOnInsert: true, includeResultMetadata: true }
      ).lean(),
    ]);
    if (!seller) return res.status(404).json({ message: 'The seller of this listing no longer exists.' });
    if (seller.isBanned) return res.status(403).json({ message: 'This user has been banned.' });

    const chat = upsertResult.value;
    res.json({
      _id: chat._id,
      otherUser: { name: seller.name, _id: seller._id, email: seller.email },
      listingId: { _id: listing._id, title: listing.title, isSold: listing.isSold },
      lastMessage: chat.lastMessage,
      unreadCount: chat.unreadCount?.[currentUserId] || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });

    // Do not hold the chat-start response open on SMTP I/O.
    if (!upsertResult.lastErrorObject?.updatedExisting) {
      void sendNewConversationEmail({ seller, buyer: req.user, listing })
        .catch((emailErr) => console.error('New conversation email failed:', emailErr.message));
    }
  } catch (err) {
    console.error('Error in /chats/start:', err);
    res.status(500).json({ message: 'Failed to start chat. Please try again.' });
  }
});

// GET /api/chats/:chatId/messages?before=<ISO date>&limit=50
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isValidId(chatId)) return res.status(400).json({ message: 'Invalid chat ID format.' });
    const pageSize = Math.min(Math.max(Number(req.query.limit) || DEFAULT_MESSAGE_PAGE_SIZE, 1), MAX_MESSAGE_PAGE_SIZE);
    const chat = await Chat.findById(chatId).select('participants').lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (!chat.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You do not have access to this chat.' });
    }
    const otherParticipantId = chat.participants.find((id) => id.toString() !== req.user._id.toString());
    const messageQuery = { chatId };
    if (req.query.before && !Number.isNaN(Date.parse(req.query.before))) {
      messageQuery.createdAt = { $lt: new Date(req.query.before) };
    }
    // User status and message page are independent after authorization.
    const [otherUser, newestFirst] = await Promise.all([
      User.findById(otherParticipantId).select('isBanned').lean(),
      Message.find(messageQuery).select('senderId content seenBy createdAt')
        .populate('senderId', 'name')
        .sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1).lean(),
    ]);
    if (otherUser?.isBanned) return res.status(403).json({ message: 'You cannot message a banned user.' });
    const hasMore = newestFirst.length > pageSize;
    const messages = newestFirst.slice(0, pageSize).reverse();
    // Headers add cursor pagination without changing the existing array response contract.
    res.set('X-Has-More', String(hasMore));
    if (hasMore && messages[0]) res.set('X-Next-Before', messages[0].createdAt.toISOString());
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

router.post('/:chatId/messages/mark-seen', protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isValidId(chatId)) return res.status(400).json({ message: 'Invalid chat ID format.' });
    const chat = await Chat.findById(chatId).select('participants').lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (!chat.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You do not have access to this chat.' });
    }
    const userId = req.user._id;
    // Bulk write and counter reset are independent, so execute them concurrently.
    await Promise.all([
      Message.updateMany({ chatId, senderId: { $ne: userId }, seenBy: { $ne: userId } }, { $addToSet: { seenBy: userId } }),
      Chat.updateOne({ _id: chatId }, { $set: { [`unreadCount.${userId}`]: 0 } }),
    ]);
    const io = req.app.get('io');
    chat.participants.filter((id) => id.toString() !== userId.toString()).forEach((id) => {
      io?.to(`user:${id}`).emit('messagesSeen', { chatId, seenBy: userId });
    });
    res.json({ message: 'Messages marked as seen.' });
  } catch (err) {
    console.error('Error marking messages as seen:', err);
    res.status(500).json({ message: 'Failed to mark messages as seen.' });
  }
});

router.post('/:chatId/messages', protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const content = req.body.content?.trim().slice(0, 2000);
    if (!content) return res.status(400).json({ message: 'Message content is required.' });
    if (!isValidId(chatId)) return res.status(400).json({ message: 'Invalid chat ID format.' });
    const chat = await Chat.findById(chatId).select('participants').lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (!chat.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You do not have access to this chat.' });
    }

    const message = await Message.create({ chatId, senderId: req.user._id, content, seenBy: [req.user._id] });
    const otherIds = chat.participants.filter((id) => id.toString() !== req.user._id.toString());
    // One atomic update replaces document mutation/save and increments recipients together.
    await Chat.updateOne({ _id: chatId }, {
      $set: { lastMessage: { content: message.content, senderId: req.user._id, createdAt: message.createdAt } },
      $inc: Object.fromEntries(otherIds.map((id) => [`unreadCount.${id}`, 1])),
    });
    const response = { ...message.toObject(), senderId: { _id: req.user._id, name: req.user.name } };
    const io = req.app.get('io');
    chat.participants.forEach((id) => io?.to(`user:${id}`).emit('newMessage', { ...response, chatId }));
    res.status(201).json(response);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

export default router;
