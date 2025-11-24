const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const pino = require('pino');
const path = require('path');
const { renderPage } = require('./playwrightPool');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

// Basic security middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 }); // 30 requests per minute per IP
app.use(limiter);

// Serve static UI
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple token auth middleware
function requireToken(req, res, next) {
  const token = process.env.PROXY_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured with PROXY_TOKEN' });
  const header = req.headers['x-api-key'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!header || header !== token) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.post('/api/render', requireToken, async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url in request body' });
  try {
    logger.info({ url }, 'render request');
    const { html, screenshot, status } = await renderPage(url, { timeout: 30000 });
    res.json({ url, status, html, screenshot: screenshot.toString('base64') });
  } catch (err) {
    logger.error({ err: err.message }, 'render error');
    res.status(500).json({ error: 'Rendering failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info({ port: PORT }, 'uhuh Playwright proxy started'));