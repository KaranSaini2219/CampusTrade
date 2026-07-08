import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Listing from "../models/Listing.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import SavedListing from "../models/SavedListing.js";

dotenv.config();

function sortParticipants(a, b) {
  return [a.toString(), b.toString()].sort((x, y) => x.localeCompare(y));
}

const seed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/campustrade-nitj"
    );
    console.log("Connected to DB:", mongoose.connection.db.databaseName);

    // ─── 1. ADMIN ─────────────────────────────────────────────────────────────
    const adminExists = await User.findOne({ email: "admin@nitj.ac.in" });
    if (!adminExists) {
      await User.create({
        email: "admin@nitj.ac.in",
        password: "admin123",
        name: "Admin",
        year: "4",
        branch: "CSE",
        role: "admin",
        isVerified: true,
      });
      console.log("✅ Admin created: admin@nitj.ac.in / admin123");
    } else {
      console.log("⏭️  Admin already exists: admin@nitj.ac.in");
    }

    // ─── 2. USERS ─────────────────────────────────────────────────────────────
    const usersToSeed = [
      { email: "student@nitj.ac.in",      password: "student123", name: "Sample Student", year: "3", branch: "CSE" },
      { email: "arjun.sharma@nitj.ac.in",  password: "Test@1234",  name: "Arjun Sharma",  year: "3", branch: "CSE" },
      { email: "priya.verma@nitj.ac.in",   password: "Test@1234",  name: "Priya Verma",   year: "2", branch: "ECE" },
      { email: "rohan.mehta@nitj.ac.in",   password: "Test@1234",  name: "Rohan Mehta",   year: "4", branch: "ME"  },
      { email: "sneha.gupta@nitj.ac.in",   password: "Test@1234",  name: "Sneha Gupta",   year: "1", branch: "CE"  },
      { email: "vikram.singh@nitj.ac.in",  password: "Test@1234",  name: "Vikram Singh",  year: "MTech", branch: "CSE" },
    ];

    const createdUsers = [];
    for (const u of usersToSeed) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const created = await User.create({ ...u, role: "user", isVerified: true });
        createdUsers.push(created);
        console.log(`✅ User created: ${u.email} / ${u.password}`);
      } else {
        createdUsers.push(exists);
        console.log(`⏭️  User already exists: ${u.email}`);
      }
    }

    // ─── 3. LISTINGS ──────────────────────────────────────────────────────────
    const listingsToSeed = [
      {
        title: "MacBook Pro 2022",
        description: "Barely used, 16GB RAM, 512GB SSD. Perfect for coding.",
        price: 95000,
        category: "Electronics",
        condition: "Like new",
        sellerIndex: 0,
      },
      {
        title: "Physics Textbook H C Verma",
        description: "Part 1 and 2, good condition. Essential for 1st year.",
        price: 300,
        category: "Books",
        condition: "Used",
        sellerIndex: 0,
      },
      {
        title: "Study Table",
        description: "Wooden study table with drawer. Fits any hostel room.",
        price: 1500,
        category: "Furniture",
        condition: "Used",
        sellerIndex: 1,
      },
      {
        title: "Samsung Galaxy S21",
        description: "6 months old, no scratches, with original box and charger.",
        price: 35000,
        category: "Electronics",
        condition: "Like new",
        sellerIndex: 1,
      },
      {
        title: "GATE 2025 Complete Study Material",
        description: "Full set of GATE CSE notes with previous year papers. Very helpful.",
        price: 1200,
        category: "Study Material",
        condition: "Used",
        sellerIndex: 2,
      },
      {
        title: "Cricket Kit (Full Set)",
        description: "Bat, pads, gloves and helmet included. Used for one season only.",
        price: 3000,
        category: "Sports",
        condition: "Like new",
        sellerIndex: 2,
      },
      {
        title: "Winter Jacket (Size L)",
        description: "Thick jacket, barely worn. Great for Jalandhar winters.",
        price: 800,
        category: "Clothing",
        condition: "Like new",
        sellerIndex: 3,
      },
      {
        title: "Data Structures by Cormen (CLRS)",
        description: "3rd edition, must have for placements. Some highlights inside.",
        price: 600,
        category: "Books",
        condition: "Used",
        sellerIndex: 3,
      },
      {
        title: "Bosch 20000mAh Power Bank",
        description: "Fast charging power bank. Works perfectly, barely used.",
        price: 900,
        category: "Electronics",
        condition: "Used",
        sellerIndex: 4,
      },
      {
        title: "Single Bed Mattress",
        description: "6 inch foam mattress, standard single bed size. Clean.",
        price: 1800,
        category: "Furniture",
        condition: "Used",
        sellerIndex: 4,
      },
      {
        title: "Badminton Racket Set",
        description: "2 Yonex rackets with shuttlecocks. Good for evening practice.",
        price: 1100,
        category: "Sports",
        condition: "Like new",
        sellerIndex: 5,
      },
      {
        title: "Operating Systems by Galvin",
        description: "8th edition. Covered topics for GATE and placements both.",
        price: 400,
        category: "Books",
        condition: "Used",
        sellerIndex: 5,
      },
    ];

    const createdListings = [];
    for (const l of listingsToSeed) {
      const seller = createdUsers[l.sellerIndex];
      const exists = await Listing.findOne({ title: l.title, sellerId: seller._id });
      if (!exists) {
        const listing = await Listing.create({
          title: l.title,
          description: l.description,
          price: l.price,
          category: l.category,
          condition: l.condition,
          images: [],
          sellerId: seller._id,
          isSold: false,
        });
        createdListings.push(listing);
        console.log(`✅ Listing created: "${l.title}" by ${seller.name}`);
      } else {
        createdListings.push(exists);
        console.log(`⏭️  Listing already exists: "${l.title}"`);
      }
    }

    // ─── 4. CHATS + MESSAGES ──────────────────────────────────────────────────

    // Chat 1: arjun (index 1) asks priya (index 2) about GATE material
    const buyer1   = createdUsers[1];
    const seller1  = createdUsers[2];
    const listing1 = createdListings.find(
      l => l.sellerId.toString() === seller1._id.toString()
    );

    if (listing1) {
      const sorted1 = sortParticipants(buyer1._id, seller1._id);
      const chatExists1 = await Chat.findOne({
        participants: { $all: sorted1 },
        listingId: listing1._id,
      });

      if (!chatExists1) {
        const chat1 = await Chat.create({
          participants: sorted1,
          listingId: listing1._id,
          unreadCount: new Map([[sorted1[0], 0], [sorted1[1], 1]]),
        });

        const msgs1 = [
          { senderId: buyer1._id,  content: `Hi! Is the "${listing1.title}" still available?` },
          { senderId: seller1._id, content: "Yes it is! Come check it anytime." },
          { senderId: buyer1._id,  content: "Can you do 10% off?" },
          { senderId: seller1._id, content: "I can do 5%, that's the best I can offer." },
          { senderId: buyer1._id,  content: "Deal! When can I pick it up?" },
        ];

        let lastMsg1;
        for (const m of msgs1) {
          lastMsg1 = await Message.create({ ...m, chatId: chat1._id, seenBy: [m.senderId] });
        }

        chat1.lastMessage = {
          content: lastMsg1.content,
          senderId: lastMsg1.senderId,
          createdAt: lastMsg1.createdAt,
        };
        await chat1.save();
        console.log(`✅ Chat created: ${buyer1.name} ↔ ${seller1.name}`);
      } else {
        console.log(`⏭️  Chat already exists: ${buyer1.name} ↔ ${seller1.name}`);
      }
    }

    // Chat 2: sneha (index 4) asks rohan (index 3) about winter jacket
    const buyer2   = createdUsers[4];
    const seller2  = createdUsers[3];
    const listing2 = createdListings.find(
      l => l.sellerId.toString() === seller2._id.toString() && l.category === "Clothing"
    );

    if (listing2) {
      const sorted2 = sortParticipants(buyer2._id, seller2._id);
      const chatExists2 = await Chat.findOne({
        participants: { $all: sorted2 },
        listingId: listing2._id,
      });

      if (!chatExists2) {
        const chat2 = await Chat.create({
          participants: sorted2,
          listingId: listing2._id,
          unreadCount: new Map([[sorted2[0], 1], [sorted2[1], 0]]),
        });

        const msgs2 = [
          { senderId: buyer2._id,  content: "Hey! Is the jacket still available?" },
          { senderId: seller2._id, content: "Yes, it is." },
          { senderId: buyer2._id,  content: "What's the lowest you can go?" },
          { senderId: seller2._id, content: "700 is the lowest, it's barely worn." },
        ];

        let lastMsg2;
        for (const m of msgs2) {
          lastMsg2 = await Message.create({ ...m, chatId: chat2._id, seenBy: [m.senderId] });
        }

        chat2.lastMessage = {
          content: lastMsg2.content,
          senderId: lastMsg2.senderId,
          createdAt: lastMsg2.createdAt,
        };
        await chat2.save();
        console.log(`✅ Chat created: ${buyer2.name} ↔ ${seller2.name}`);
      } else {
        console.log(`⏭️  Chat already exists: ${buyer2.name} ↔ ${seller2.name}`);
      }
    }

    // ─── 5. SAVED LISTINGS ────────────────────────────────────────────────────
    const savedPairs = [
      { userIndex: 0, listingIndex: 3 },
      { userIndex: 1, listingIndex: 8 },
      { userIndex: 4, listingIndex: 0 },
    ];

    for (const pair of savedPairs) {
      const user    = createdUsers[pair.userIndex];
      const listing = createdListings[pair.listingIndex];
      if (!user || !listing) continue;

      const exists = await SavedListing.findOne({ userId: user._id, listingId: listing._id });
      if (!exists) {
        await SavedListing.create({ userId: user._id, listingId: listing._id });
        console.log(`✅ ${user.name} saved "${listing.title}"`);
      } else {
        console.log(`⏭️  Saved listing already exists for ${user.name}`);
      }
    }

    // ─── SUMMARY ──────────────────────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seed complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📋 Login credentials:");
    console.log("   admin@nitj.ac.in                    / admin123");
    usersToSeed.forEach(u =>
      console.log(`   ${u.email.padEnd(35)} / ${u.password}`)
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seed();
