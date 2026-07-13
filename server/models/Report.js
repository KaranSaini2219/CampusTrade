import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: ['Inappropriate', 'Spam', 'Scam', 'Wrong category', 'Other'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved'],
    default: 'open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Covers duplicate-open-report checks and keeps one report per user/listing/status lookup fast.
reportSchema.index({ reporterId: 1, listingId: 1, status: 1 });
// Serves the admin status queue in newest-first order.
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ listingId: 1 });

export default mongoose.model('Report', reportSchema);
