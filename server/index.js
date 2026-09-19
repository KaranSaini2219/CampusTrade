// FIRST LINE - before everything else
import dotenv from 'dotenv';
dotenv.config();

//console.log('MONGO URI LOADED:', process.env.MONGODB_URI);

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
import { generalLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A missing signing secret makes every authentication token unsafe. Local
// development may still use an explicitly configured value, while production
// refuses to start until its host provides one as a secret environment variable.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured in production.');
}

connectDB();

// rest of your code stays exactly the same...

const app = express();
const httpServer = createServer(app);

// Render sits in front of this service as one trusted reverse proxy. This lets
// express-rate-limit use the actual visitor IP from X-Forwarded-For instead of
// treating every request as coming from the proxy.
app.set('trust proxy', 1);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  // Chat only needs WebSocket; disabling long-polling reduces connection overhead.
  transports: ['websocket'],
  perMessageDeflate: false,
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d', etag: true }));
// Apply one inexpensive API-wide safety valve before route work reaches MongoDB.
app.use('/api', generalLimiter);

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
