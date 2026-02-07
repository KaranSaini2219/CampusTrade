import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to ensure participants are always sorted
function sortParticipants(participants) {
  return [...participants].sort((a, b) => {
    const aStr = a.toString();
    const bStr = b.toString();
    return aStr.localeCompare(bStr);
  });
}

// GET /api/chats - Get user's chats
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name email year branch')
      .populate('listingId', 'title price images isSold')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = chats.map((c) => {
      const other = c.participants.find((p) => p._id.toString() !== req.user._id.toString());
      return {
        _id: c._id,
        otherUser: other || { name: 'Unknown User', _id: null },
        listingId: c.listingId,
        lastMessage: c.lastMessage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ message: 'Failed to fetch chats.', error: err.message });
  }
});

// POST /api/chats/start - Start or get existing chat
router.post('/start', protect, async (req, res) => {
  try {
    const { listingId } = req.body;
    
    console.log('🚀 Starting chat - User:', req.user._id, 'Listing:', listingId);
    
    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }

    // Find the listing
    const listing = await Listing.findById(listingId).lean();
    if (!listing) {
      console.log('❌ Listing not found:', listingId);
      return res.status(404).json({ message: 'Listing not found.' });
    }

    console.log('✅ Listing found:', listing.title, 'Seller:', listing.sellerId);

    if (!listing.sellerId) {
      return res.status(400).json({ message: 'This listing has no seller.' });
    }

    const sellerId = listing.sellerId.toString();
    const currentUserId = req.user._id.toString();

    // Check if user is trying to chat with themselves
    if (sellerId === currentUserId) {
      return res.status(400).json({ message: 'You cannot chat with yourself about your own listing.' });
    }

    // Verify seller exists
    const seller = await User.findById(sellerId).lean();
    if (!seller) {
      console.log('❌ Seller not found:', sellerId);
      return res.status(404).json({ message: 'The seller of this listing no longer exists.' });
    }

    console.log('✅ Seller exists:', seller.name);

    // IMPORTANT: Sort participants for consistent querying and saving
    const sortedParticipants = sortParticipants([currentUserId, sellerId]);
    
    console.log('🔍 Looking for existing chat with participants:', sortedParticipants);

    // Find existing chat with sorted participants
    let chat = await Chat.findOne({
      participants: { $all: sortedParticipants },
      listingId: listingId,
    })
      .populate('participants', 'name email year branch')
      .populate('listingId', 'title price images isSold')
      .lean();

    if (chat) {
      console.log('✅ Found existing chat:', chat._id);
    } else {
      console.log('📝 Creating new chat...');
      
      try {
        // Create new chat with sorted participants
        const newChat = await Chat.create({
          participants: sortedParticipants,
          listingId: listingId,
        });
        
        console.log('✅ Chat created:', newChat._id);
        
        // Fetch populated version
        chat = await Chat.findById(newChat._id)
          .populate('participants', 'name email year branch')
          .populate('listingId', 'title price images isSold')
          .lean();
        
      } catch (createErr) {
        console.error('❌ Error creating chat:', createErr);
        
        // Handle duplicate key error
        if (createErr.code === 11000) {
          console.log('⚠️ Duplicate detected, fetching existing chat...');
          
          chat = await Chat.findOne({
            participants: { $all: sortedParticipants },
            listingId: listingId,
          })
            .populate('participants', 'name email year branch')
            .populate('listingId', 'title price images isSold')
            .lean();
          
          if (!chat) {
            throw new Error('Chat exists but could not be retrieved');
          }
        } else {
          throw createErr;
        }
      }
    }

    // Format response
    const other = chat.participants.find(
      (p) => p._id.toString() !== currentUserId
    );

    const response = {
      _id: chat._id,
      otherUser: other || { name: seller.name, _id: seller._id, email: seller.email },
      listingId: chat.listingId,
      lastMessage: chat.lastMessage,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    console.log('✅ Chat ready:', response._id, 'with', response.otherUser.name);
    res.json(response);
    
  } catch (err) {
    console.error('❌ Error in /chats/start:', err);
    res.status(500).json({ 
      message: 'Failed to start chat. Please try again.', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID format.' });
    }

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }
    
    // SECURITY: Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      console.warn('⚠️ Unauthorized access attempt to chat:', req.params.chatId);
      return res.status(403).json({ message: 'You do not have access to this chat.' });
    }

    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
    
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages.', error: err.message });
  }
});

// POST /api/chats/:chatId/messages
router.post('/:chatId/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID format.' });
    }

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }
    
    // SECURITY: Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      console.warn('⚠️ Unauthorized message attempt');
      return res.status(403).json({ message: 'You do not have access to this chat.' });
    }

    const message = await Message.create({
      chatId: req.params.chatId,
      senderId: req.user._id,
      content: content.trim().substring(0, 2000),
    });

    // Update chat's last message
    chat.lastMessage = {
      content: message.content,
      senderId: req.user._id,
      createdAt: message.createdAt,
    };
    chat.updatedAt = new Date();
    await chat.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name email')
      .lean();

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach((participantId) => {
        io.to(`user:${participantId}`).emit('newMessage', {
          ...populated,
          chatId: req.params.chatId,
        });
      });
    }

    res.status(201).json(populated);
    
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).json({ message: 'Failed to send message.', error: err.message });
  }
});

export default router;
