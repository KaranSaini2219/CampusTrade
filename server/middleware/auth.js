import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - require valid JWT and non-banned user
 */
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password -profilePicture');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Require admin role
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};
