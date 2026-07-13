import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Books', 'Furniture', 'Sports', 'Clothing', 'Study Material', 'Other'],
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like new', 'Used'],
  },
  images: [{
    type: String,
  }],
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isSold: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ sellerId: 1, createdAt: -1 });
// Serves the public feed's unsold/category filter in its display order.
listingSchema.index({ isSold: 1, category: 1, createdAt: -1 });
// Serves the default public feed when no category is selected.
listingSchema.index({ isSold: 1, createdAt: -1 });
// Serves price-sorted filtered feeds without an in-memory sort.
listingSchema.index({ isSold: 1, category: 1, price: 1 });

export default mongoose.model('Listing', listingSchema);
