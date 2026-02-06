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
listingSchema.index({ category: 1, isSold: 1 });
listingSchema.index({ createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
