import express from 'express';
import { z } from 'zod';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const reportSchema = z.object({
  listingId: z.string(),
  reason: z.enum(['Inappropriate', 'Spam', 'Scam', 'Wrong category', 'Other']),
  comment: z.string().max(500).optional(),
});

// POST /api/reports - Report a listing
router.post('/', protect, async (req, res) => {
  try {
    const data = reportSchema.parse(req.body);

    const existing = await Report.findOne({
      reporterId: req.user._id,
      listingId: data.listingId,
      status: 'open',
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reported this listing.' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      listingId: data.listingId,
      reason: data.reason,
      comment: data.comment || '',
    });

    res.status(201).json({ message: 'Report submitted. Admins will review it.', report });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }
    res.status(500).json({ message: 'Failed to submit report.' });
  }
});

export default router;
