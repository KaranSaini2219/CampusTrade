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

blockLogSchema.index({ createdAt: -1 });

export default mongoose.model('BlockLog', blockLogSchema);
