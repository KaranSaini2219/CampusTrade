import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Listing from '../models/Listing.js';
import SavedListing from '../models/SavedListing.js';
import BlockLog from '../models/BlockLog.js';
import { protect } from '../middleware/auth.js';
import { checkBannedContent } from '../utils/contentFilter.js';
import { upload, cloudinary, useCloudinary } from '../config/cloudinary.js';

const router = express.Router();

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Sports', 'Clothing', 'Study Material', 'Other'];
const CONDITIONS = ['New', 'Like new', 'Used'];

const createListingSchema = z.object({
  title: z.string().min(1).max(150).trim(),
  description: z.string().min(1).max(2000).trim(),
  price: z.number().min(0),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
});

// GET /api/listings/saved - Protected
router.get('/saved', protect, async (req, res) => {
  try {
    const saved = await SavedListing.find({ userId: req.user._id })
      .populate('listingId')
      .sort({ createdAt: -1 })
      .lean();
    const listings = saved
      .map((s) => s.listingId)
      .filter(Boolean)
      .map((l) => ({ ...l, saved: true }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch saved listings.' });
  }
});

// GET /api/listings - Public (search, filter, sort) or ?mine=1 for own
router.get('/', async (req, res) => {
  try {
    const { search, category, sort = 'newest', minPrice, maxPrice, mine } = req.query;
    const query = {};
    if (mine) {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        query.sellerId = decoded.id;
      } catch (_) {
        return res.json([]);
      }
    } else {
      query.isSold = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    let sortOpt = { createdAt: -1 };
    if (sort === 'price-asc') sortOpt = { price: 1 };
    if (sort === 'price-desc') sortOpt = { price: -1 };

    const listings = await Listing.find(query)
      .populate('sellerId', 'name year branch')
      .sort(sortOpt)
      .lean();

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings.' });
  }
});

// GET /api/listings/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'name year branch email')
      .lean();

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Don't expose seller email/phone in public response
    if (listing.sellerId) {
      listing.sellerId.email = undefined;
    }

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listing.' });
  }
});

// POST /api/listings - Protected
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const body = { ...req.body, price: Number(req.body.price) };
    const data = createListingSchema.parse(body);

    const { isBlocked, matchedKeywords } = checkBannedContent(
      `${data.title} ${data.description}`
    );

    if (isBlocked) {
      await BlockLog.create({
        userId: req.user._id,
        listingDraft: { title: data.title, description: data.description },
        matchedKeywords,
      });
      return res.status(400).json({
        message: 'Listing contains prohibited content. Only legal items allowed. Admins may remove listings.',
        blocked: true,
      });
    }

    let imageUrls = [];

    if (req.files?.length) {
      if (useCloudinary) {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'campustrade-nitj' },
              (err, result) => {
                if (err) reject(err);
                else resolve(result?.secure_url);
              }
            );
            uploadStream.end(file.buffer);
          });
        });
        imageUrls = await Promise.all(uploadPromises);
      } else {
        imageUrls = req.files.map(
          (f) => `${process.env.API_URL || 'http://localhost:5000'}/uploads/${f.filename}`
        );
      }
    }

    const listing = await Listing.create({
      ...data,
      images: imageUrls,
      sellerId: req.user._id,
    });

    const populated = await Listing.findById(listing._id)
      .populate('sellerId', 'name year branch')
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }
    res.status(500).json({ message: 'Failed to create listing.' });
  }
});

// PUT /api/listings/:id - Protected (owner only)
router.put('/:id', protect, upload.array('images', 5), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this listing.' });
    }

    const body = { ...req.body, price: req.body.price ? Number(req.body.price) : listing.price };
    const data = createListingSchema.partial().parse(body);

    if (data.title || data.description) {
      const text = `${data.title || listing.title} ${data.description || listing.description}`;
      const { isBlocked, matchedKeywords } = checkBannedContent(text);
      if (isBlocked) {
        await BlockLog.create({
          userId: req.user._id,
          listingDraft: { title: data.title, description: data.description },
          matchedKeywords,
        });
        return res.status(400).json({
          message: 'Listing contains prohibited content.',
          blocked: true,
        });
      }
    }

    let imageUrls = listing.images || [];
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        if (Array.isArray(parsed)) {
          imageUrls = parsed;
        }
      } catch (_) {}
    }
    if (req.files?.length) {
      if (useCloudinary) {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'campustrade-nitj' },
              (err, result) => {
                if (err) reject(err);
                else resolve(result?.secure_url);
              }
            );
            uploadStream.end(file.buffer);
          });
        });
        imageUrls = [...imageUrls, ...(await Promise.all(uploadPromises))].slice(0, 5);
      } else {
        const newUrls = req.files.map(
          (f) => `${process.env.API_URL || 'http://localhost:5000'}/uploads/${f.filename}`
        );
        imageUrls = [...imageUrls, ...newUrls].slice(0, 5);
      }
    }

    Object.assign(listing, { ...data, images: imageUrls });
    await listing.save();

    const populated = await Listing.findById(listing._id)
      .populate('sellerId', 'name year branch')
      .lean();
    res.json(populated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }
    res.status(500).json({ message: 'Failed to update listing.' });
  }
});

// DELETE /api/listings/:id - Protected (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing.' });
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete listing.' });
  }
});

// POST /api/listings/:id/save - Protected
router.post('/:id/save', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    const existing = await SavedListing.findOne({
      userId: req.user._id,
      listingId: req.params.id,
    });

    if (existing) {
      await SavedListing.findByIdAndDelete(existing._id);
      return res.json({ saved: false, message: 'Removed from saved.' });
    }

    await SavedListing.create({ userId: req.user._id, listingId: req.params.id });
    res.json({ saved: true, message: 'Added to saved.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save listing.' });
  }
});

// POST /api/listings/:id/mark-sold - Protected (owner only)
router.post('/:id/mark-sold', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    listing.isSold = true;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as sold.' });
  }
});

export default router;
