import mongoose from 'mongoose';

const savedListingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

savedListingSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export default mongoose.model('SavedListing', savedListingSchema);
