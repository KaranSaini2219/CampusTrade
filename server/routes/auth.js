import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { isAllowedEmailDomain } from '../utils/emailDomain.js';
import { sendOTPEmail } from '../utils/email.js';
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

function generateToken(id) {
  return jwt.sign(
    { id },
   process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    if (!isAllowedEmailDomain(data.email)) {
      return res.status(400).json({
        message: 'Only NIT Jalandhar students can register. Use your @nitj.ac.in email.',
      });
    }

    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists && exists.isVerified) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (exists && !exists.isVerified) {
      exists.password = data.password;
      exists.name = data.name;
      exists.year = data.year;
      exists.branch = data.branch;
      exists.verificationToken = otp;
      exists.verificationExpires = otpExpires;
      await exists.save();
      user = exists;
    } else {
      user = await User.create({
        ...data,
        email: data.email.toLowerCase(),
        verificationToken: otp,
        verificationExpires: otpExpires,
        isVerified: false,
      });
    }

    try {
      await sendOTPEmail(data.email.toLowerCase(), otp);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      return res.status(500).json({
        message: 'Account created but email failed to send. Please use Resend OTP.',
        email: data.email.toLowerCase(),
        canResend: true,
      });
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify.',
      email: data.email.toLowerCase(),
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', registerLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: otp.toString().trim(),
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
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
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', registerLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
    if (!user) {
      return res.status(400).json({ message: 'No pending verification for this email.' });
    }

    const otp = generateOTP();
    user.verificationToken = otp;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email.toLowerCase(), otp);
    res.json({ message: 'OTP resent successfully.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Failed to resend OTP.' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in.' });
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

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
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
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

// POST /api/auth/upload-profile-picture
router.post('/upload-profile-picture', protect, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    if (!profilePicture.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format.' });
    }

    const sizeInBytes = (profilePicture.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024;
    if (sizeInBytes > maxSize) {
      return res.status(400).json({ message: 'Image too large. Maximum size is 5MB.' });
    }

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