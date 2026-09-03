require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const compression= require('compression');
const morgan     = require('morgan');
const path       = require('path');
const logger     = require('./config/logger');

const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const studentRoutes     = require('./routes/student.routes');
const activityRoutes    = require('./routes/activity.routes');
const verificationRoutes= require('./routes/verification.routes');
const aiRoutes          = require('./routes/ai.routes');
const certificateRoutes = require('./routes/certificate.routes');
const adminRoutes       = require('./routes/admin.routes');

const app = express();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,       // Allow PDF embed
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc:     ["'self'", "data:", "blob:"],
      scriptSrc:  ["'self'"],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Compression (gzip) ────────────────────────────────────────────────────────
app.use(compression());

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP Request Logging (Morgan → Winston) ───────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/api/health',   // Skip health check noise
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Global limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
}));

// Strict limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

// AI routes can be heavy — separate limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 10,
  message: { success: false, message: 'AI assessment limit reached. Please wait a minute.' },
});

// ── Static Uploads ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  etag: true,
}));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'CharactAI API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()) + 's',
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/activities',   activityRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/ai',           aiLimiter, aiRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin',        adminRoutes);

// ── 404 + Global Error Handler ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
