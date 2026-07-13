import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Supports fetching the newest page of a conversation and cursor pagination.
messageSchema.index({ chatId: 1, createdAt: -1, _id: -1 });
// Keeps defensive user-deletion cleanup indexed.
messageSchema.index({ senderId: 1 });

export default mongoose.model('Message', messageSchema);
