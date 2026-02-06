import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Listing from "../models/Listing.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/campustrade-nitj"
    );
    console.log("Connected to DB");

    // ----- Admin user -----
    const adminExists = await User.findOne({ email: "admin@nitj.ac.in" });
    if (!adminExists) {
      await User.create({
        email: "admin@nitj.ac.in",
        password: "admin123", // ✅ plaintext (will be hashed by pre-save hook)
        name: "Admin",
        year: "4",
        branch: "CSE",
        role: "admin",
        isVerified: true,
      });

      console.log("Admin created: admin@nitj.ac.in / admin123");
    } else {
      console.log("Admin already exists: admin@nitj.ac.in");
    }

    // ----- Sample user -----
    const userExists = await User.findOne({ email: "student@nitj.ac.in" });

    let sampleUserId;
    if (!userExists) {
      const user = await User.create({
        email: "student@nitj.ac.in",
        password: "student123", // ✅ plaintext (hashed by pre-save hook)
        name: "Sample Student",
        year: "3",
        branch: "CSE",
        role: "user",
        isVerified: true,
      });

      sampleUserId = user._id;
      console.log("Sample user: student@nitj.ac.in / student123");
    } else {
      sampleUserId = userExists._id;
      console.log("Sample user already exists: student@nitj.ac.in");
    }

    // ----- Sample listings -----
    const count = await Listing.countDocuments();

    if (count === 0 && sampleUserId) {
      await Listing.insertMany([
        {
          title: "MacBook Pro 2022",
          description: "Barely used, 16GB RAM",
          price: 95000,
          category: "Electronics",
          condition: "Like new",
          sellerId: sampleUserId,
        },
        {
          title: "Physics Textbook H C Verma",
          description: "Part 1 and 2, good condition",
          price: 300,
          category: "Books",
          condition: "Used",
          sellerId: sampleUserId,
        },
        {
          title: "Study Table",
          description: "Wooden study table with drawer",
          price: 1500,
          category: "Furniture",
          condition: "Used",
          sellerId: sampleUserId,
        },
      ]);

      console.log("Sample listings created");
    } else {
      console.log("Listings already exist, skipping listing seed.");
    }

    console.log("Seed complete");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seed();
