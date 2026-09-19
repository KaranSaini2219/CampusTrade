import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Listing from '../models/Listing.js';
import SavedListing from '../models/SavedListing.js';
import BlockLog from '../models/BlockLog.js';
import { protect } from '../middleware/auth.js';
import { checkBannedContent } from '../utils/contentFilter.js';
import { upload, cloudinary, useCloudinary } from '../config/cloudinary.js';
import { cacheListingFeed, getCachedListingFeed, invalidateListingFeedCache } from '../utils/listingFeedCache.js';

//console.log('>>> THIS IS THE LISTINGS FILE BEING LOADED <<<');

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
      // Only listing-card fields are needed; avoid hydrating unused documents.
      .populate('listingId', 'title description price category condition images sellerId isSold createdAt updatedAt')
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
  //console.log('>>> ROUTE HANDLER ENTERED <<<');
  try {
    const { search, category, sort = 'newest', minPrice, maxPrice, mine } = req.query;
    const cacheKey = req.originalUrl;
    if (!mine) {
      const cached = getCachedListingFeed(cacheKey);
      if (cached) return res.json(cached);
    }
    const query = {};
    if (mine) {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    
    
//console.log("DB:", Listing.db.name);
//console.log("QUERY:", query);

    const listings = await Listing.find(query)
      // A populate match avoids a separate full banned-user ID scan on every feed request.
      .populate({ path: 'sellerId', select: 'name year branch', match: { isBanned: false } })
      .sort(sortOpt)
      .lean();

    // A matched-out seller is a banned/deleted seller and must remain hidden from the public feed.
    const response = mine ? listings : listings.filter((listing) => listing.sellerId);
    // Cache public-only responses briefly; mutations invalidate all filter variants.
    if (!mine) cacheListingFeed(cacheKey, response);
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings.' });
  }
});

// GET /api/listings/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'name year branch')
      .lean();

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
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

    // Reuse authenticated seller data instead of issuing a read-after-write populate query.
    const response = listing.toObject();
    response.sellerId = { _id: req.user._id, name: req.user.name, year: req.user.year, branch: req.user.branch };
    invalidateListingFeedCache();
    res.status(201).json(response);
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

    // The owner is already authenticated, so no second listing/populate read is necessary.
    const response = listing.toObject();
    response.sellerId = { _id: req.user._id, name: req.user.name, year: req.user.year, branch: req.user.branch };
    invalidateListingFeedCache();
    res.json(response);
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
    invalidateListingFeedCache();
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
    }).select('_id').lean();

    if (existing) {
      await SavedListing.deleteOne({ _id: existing._id });
      return res.json({ saved: false, message: 'Removed from saved.' });
    }

    // The unique compound index is the final race-safe guard for concurrent toggles.
    await SavedListing.create({ userId: req.user._id, listingId: req.params.id });
    res.json({ saved: true, message: 'Added to saved.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save listing.' });
  }
});

// POST /api/listings/:id/mark-sold - Protected (owner only)
router.post('/:id/mark-sold', protect, async (req, res) => {
  try {
    // Authorization and update in one indexed operation remove a read/write round trip.
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { $set: { isSold: true } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found or not authorized.' });
    invalidateListingFeedCache();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as sold.' });
  }
});

export default router;
