import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import BlockLog from '../models/BlockLog.js';
import SavedListing from '../models/SavedListing.js';
import { invalidateListingFeedCache } from './listingFeedCache.js';

export async function deleteUserCascade(userId) {
  // The two ID-only reads avoid hydrating whole listing/chat documents for cleanup.
  const [listings, chats] = await Promise.all([
    Listing.find({ sellerId: userId }, '_id').lean(),
    Chat.find({ participants: userId }, '_id').lean(),
  ]);
  const listingIds = listings.map((listing) => listing._id);
  const chatIds = chats.map((chat) => chat._id);

  // All cleanup writes are independent once IDs are known, so perform them concurrently.
  await Promise.all([
    Listing.deleteMany({ sellerId: userId }),
    Report.deleteMany({ $or: [{ reporterId: userId }, { listingId: { $in: listingIds } }] }),
    BlockLog.deleteMany({ userId }),
    Message.deleteMany({ chatId: { $in: chatIds } }),
    Chat.deleteMany({ _id: { $in: chatIds } }),
    Message.deleteMany({ senderId: userId }),
    SavedListing.deleteMany({ $or: [{ userId }, { listingId: { $in: listingIds } }] }),
  ]);
  invalidateListingFeedCache();
  await User.findByIdAndDelete(userId);
}
