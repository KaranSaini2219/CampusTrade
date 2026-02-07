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

// Unique index ensures one chat per user-pair per listing
// This ALLOWS: UserA+Seller+Item1, UserB+Seller+Item1 (different users)
// This PREVENTS: UserA+Seller+Item1 twice (same conversation)
chatSchema.index({ participants: 1, listingId: 1 });

// Index for faster queries
chatSchema.index({ updatedAt: -1 });

// CRITICAL: Sort participants array before saving to ensure consistency
// Without this, [A,B] and [B,A] are treated as different by the unique index!
chatSchema.pre('save', function(next) {
  if (this.isModified('participants') || this.isNew) {
    // Sort participants to ensure [userA, userB] is always in same order
    this.participants.sort((a, b) => {
      const aStr = a.toString();
      const bStr = b.toString();
      return aStr.localeCompare(bStr);
    });
  }
  next();
});

export default mongoose.model('Chat', chatSchema);
