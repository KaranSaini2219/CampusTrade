import mongoose from 'mongoose';

const blockLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listingDraft: {
    title: String,
    description: String,
  },
  matchedKeywords: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Supports both per-user cleanup and newest-first admin audit views.
blockLogSchema.index({ userId: 1, createdAt: -1 });
blockLogSchema.index({ createdAt: -1 });

export default mongoose.model('BlockLog', blockLogSchema);
