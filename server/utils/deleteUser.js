// server/utils/deleteUser.js
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import BlockLog from '../models/BlockLog.js';
import SavedListing from '../models/SavedListing.js';   // ← ADD THIS IMPORT

export async function deleteUserCascade(userId) {
  // 1. Find listing IDs owned by this user (needed for Report cleanup)
  const listings = await Listing.find({ sellerId: userId }, '_id');
  const listingIds = listings.map(l => l._id);

  // 2. Delete the listings themselves
  await Listing.deleteMany({ sellerId: userId });

  // 3. Delete reports filed by this user, AND reports about their (now-deleted) listings
  await Report.deleteMany({
    $or: [
      { reporterId: userId },
      { listingId: { $in: listingIds } },
    ],
  });

  // 4. Delete this user's block logs
  await BlockLog.deleteMany({ userId });

  // 5. Find and delete all chats this user is part of
  const chats = await Chat.find({ participants: userId }, '_id');
  const chatIds = chats.map(c => c._id);
  await Message.deleteMany({ chatId: { $in: chatIds } });
  await Chat.deleteMany({ _id: { $in: chatIds } });

  // 5b. Delete any messages this user sent in other chats (defensive, low-risk edge case)
  await Message.deleteMany({ senderId: userId });          // ← ADD THIS

  // 6. Delete saved-listing records: this user's own saves, and
  //    other users' saves pointing at this user's (now-deleted) listings
  await SavedListing.deleteMany({                          // ← ADD THIS
    $or: [
      { userId },
      { listingId: { $in: listingIds } },
    ],
  });

  // 7. Finally delete the user
  await User.findByIdAndDelete(userId);
}