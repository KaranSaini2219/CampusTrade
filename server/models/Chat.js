import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  lastMessage: {
    content: String,
    senderId: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

chatSchema.index({ participants: 1, listingId: 1 }, { unique: true });
chatSchema.index({ updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);
