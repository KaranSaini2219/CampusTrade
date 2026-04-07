import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { isAllowedEmailDomain } from '../utils/emailDomain.js';
import crypto from 'crypto';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(50),
  name: z.string().min(1).max(100).trim(),
  year: z.enum(['1', '2', '3', '4', 'MTech']),
  branch: z.string().min(1).max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    if (!isAllowedEmailDomain(data.email)) {
      return res.status(400).json({
        message: `Only NIT Jalandhar students can register. Use your @nitj.ac.in email.`,
      });
    }

    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      ...data,
      email: data.email.toLowerCase(),
      verificationToken: token,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // In production, send email with verification link/OTP
    // For now, auto-verify for development
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);
    res.status(201).json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        year: user.year,
        branch: user.branch,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const jwtToken = generateToken(user._id);
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        year: user.year,
        branch: user.branch,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    res.status(500).json({ message: 'Login failed.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { email, token } = verifySchema.parse(req.body);
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        year: user.year,
        branch: user.branch,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      year: req.user.year,
      branch: req.user.branch,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
    },
  });
});

// POST /api/auth/upload-profile-picture
router.post('/upload-profile-picture', protect, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    // Validate base64 format
    if (!profilePicture.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format.' });
    }

    // Check file size (limit to 5MB in base64)
    const sizeInBytes = (profilePicture.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (sizeInBytes > maxSize) {
      return res.status(400).json({ message: 'Image too large. Maximum size is 5MB.' });
    }

    // Update user profile picture
    req.user.profilePicture = profilePicture;
    await req.user.save();

    res.json({
      message: 'Profile picture updated successfully.',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        year: req.user.year,
        branch: req.user.branch,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
      },
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ message: 'Failed to upload profile picture.' });
  }
});

// DELETE /api/auth/delete-profile-picture
router.delete('/delete-profile-picture', protect, async (req, res) => {
  try {
    req.user.profilePicture = null;
    await req.user.save();

    res.json({
      message: 'Profile picture deleted successfully.',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        year: req.user.year,
        branch: req.user.branch,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
      },
    });
  } catch (err) {
    console.error('Profile picture delete error:', err);
    res.status(500).json({ message: 'Failed to delete profile picture.' });
  }
});

export default router;
