import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Report from '../models/Report.js';
import BlockLog from '../models/BlockLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -verificationToken')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { ban } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban admin user.' });
    }
    user.isBanned = !!ban;
    await user.save();
    res.json({ message: ban ? 'User banned.' : 'User unbanned.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// DELETE /api/admin/listings/:id
router.delete('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ message: 'Listing removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove listing.' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate('listingId', 'title sellerId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

// PUT /api/admin/reports/:id - Update report status
router.put('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update report.' });
  }
});

// GET /api/admin/block-logs
router.get('/block-logs', async (req, res) => {
  try {
    const logs = await BlockLog.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch block logs.' });
  }
});

export default router;
