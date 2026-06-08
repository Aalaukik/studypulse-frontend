import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// ─── Startup guards ────────────────────────────────────────────────────────────
// Fail immediately in production if critical secrets are missing.
// This prevents the app from running with insecure defaults.
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

import authRouter from './routes/auth';
import googleAuthRouter from './routes/googleAuth';
import { subjectsRouter, goalsRouter, reviewCardsRouter } from './routes/core';
import {
  examsRouter, sessionsRouter, mistakesRouter,
  energyRouter, papersRouter, weeklyReviewsRouter,
  xpRouter, challengesRouter,
} from './routes/features';
import prisma from './lib/prisma';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Allow Google GSI script for OAuth
      scriptSrc: ["'self'", 'accounts.google.com', "'unsafe-inline'"],
      frameSrc:  ["'self'", 'accounts.google.com'],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Supports exact origins AND simple glob patterns (e.g. https://*.vercel.app).
// NEVER set FRONTEND_URLS=* in production — list your real Vercel URLs.
function originMatchesPattern(origin: string, pattern: string): boolean {
  if (pattern === origin) return true;
  if (pattern.includes('*')) {
    // Convert glob to regex: escape dots, replace * with [^.]+ (no subdomain crossing)
    const escaped = pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    return new RegExp(`^${escaped}$`).test(origin);
  }
  return false;
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server or same-origin requests (no Origin header)
    if (!origin) { cb(null, true); return; }

    const patterns = (process.env.FRONTEND_URLS || 'http://localhost:5173')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const allowed = patterns.some(p => originMatchesPattern(origin, p));
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,                  // tightened from 200
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',              authLimiter, authRouter);
app.use('/api/auth',              authLimiter, googleAuthRouter);  // POST /api/auth/google
app.use('/api/v1/subjects',       apiLimiter,  subjectsRouter);
app.use('/api/v1/goals',          apiLimiter,  goalsRouter);
app.use('/api/v1/review-cards',   apiLimiter,  reviewCardsRouter);
app.use('/api/v1/exams',          apiLimiter,  examsRouter);
app.use('/api/v1/sessions',       apiLimiter,  sessionsRouter);
app.use('/api/v1/mistakes',       apiLimiter,  mistakesRouter);
app.use('/api/v1/energy',         apiLimiter,  energyRouter);
app.use('/api/v1/papers',         apiLimiter,  papersRouter);
app.use('/api/v1/weekly-reviews', apiLimiter,  weeklyReviewsRouter);
app.use('/api/v1/xp',             apiLimiter,  xpRouter);
app.use('/api/v1/challenges',     apiLimiter,  challengesRouter);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 StudyPulse API running on http://localhost:${PORT}`);
      console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

main();

process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
