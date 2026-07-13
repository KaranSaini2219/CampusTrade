import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import SavedListing from '../models/SavedListing.js';
import Report from '../models/Report.js';
import BlockLog from '../models/BlockLog.js';

dotenv.config();

// Run deliberately during deployment: syncIndexes creates additions and removes
// obsolete schema indexes without making production application startup blocking.
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campustrade-nitj');
for (const model of [User, Listing, Chat, Message, SavedListing, Report, BlockLog]) {
  const dropped = await model.syncIndexes();
  console.log(`${model.modelName}: synchronized${dropped.length ? `; dropped ${dropped.join(', ')}` : ''}`);
}
await mongoose.disconnect();
