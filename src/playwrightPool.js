const { chromium } = require('playwright');

// Simple Playwright pool: single browser instance, create context per request.
let browserPromise = null;

async function ensureBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }
  return browserPromise;
}

async function renderPage(url, opts = {}) {
  const browser = await ensureBrowser();
  const context = await (await browser).newContext({
    userAgent: opts.userAgent || 'uhuh-playwright-proxy/1.0',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  try {
    const resp = await page.goto(url, { timeout: opts.timeout || 30000, waitUntil: 'networkidle' });
    const status = resp ? resp.status() : null;
    const content = await page.content();
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 70 });
    return { html: content, screenshot, status };
  } finally {
    try {
      await context.close();
    } catch (e) {
      // ignore
    }
  }
}

module.exports = { renderPage };