require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const chatRoute = require('./src/routes/chat');
const bookingsRoute = require('./src/routes/bookings');
const { initializeDatabase } = require('./src/dbInit');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: restrict to the hotel's own domain(s) in production. Comma-separate
// multiple origins in ALLOWED_ORIGINS. Defaults to "*" for local development
// only — tighten this before deploying.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

app.use(express.json({ limit: '20kb' }));

// Basic rate limiting — protects the Groq free tier from being burned by
// accidental loops or abuse. Tune via env vars for production traffic.
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', groq_configured: Boolean(process.env.GROQ_API_KEY) });
});

app.use('/api', chatRoute);
app.use('/api/bookings', bookingsRoute);

// Never leak internal error details to the client
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

initializeDatabase().catch((err) => console.error('[db] initialization failed:', err.message));

app.listen(PORT, () => {
  console.log(`ELCT Bukoba concierge backend listening on port ${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set — /api/chat will return fallback messages until it is.');
  }
});
