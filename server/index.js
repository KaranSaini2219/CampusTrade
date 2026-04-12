// FIRST LINE - before everything else
import dotenv from 'dotenv';
dotenv.config();

// THEN all other imports
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import chatRoutes from './routes/chat.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import { setupSocketIO } from './socket/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

connectDB();

// rest of your code stays exactly the same...

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
setupSocketIO(io);
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`CampusTrade NITJ server running on port ${PORT}`);
});
