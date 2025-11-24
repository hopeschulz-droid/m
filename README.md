# uhuh — Playwright-based Private Web Proxy (scaffold)

This repository contains a minimal scaffold for a private web proxy that uses Playwright to render pages server-side and return a rendered HTML snapshot and screenshot. It's designed for private/self-hosted use.

## Features (minimal)
- Express API with `/api/render` (POST) that accepts `{ url }` and requires an API token via `x-api-key` or `Authorization: Bearer <token>`.
- Renders pages using Playwright (Chromium) in a fresh browser context per request to isolate cookies/storage.
- Returns page HTML and a JPEG screenshot (base64) in the JSON response.
- Basic rate limiting and minimal security headers.

## Quickstart (local)
1. Set `PROXY_TOKEN` environment variable before starting (this enables simple auth):

```bash
export PROXY_TOKEN="your-secret-token"
npm install
npm start
```

2. Open `http://localhost:3000` and use the UI. Provide the same API token you set in `PROXY_TOKEN`.

## Docker
Build and run with the included Dockerfile (Playwright base image):

```bash
docker build -t uhuh-playwright-proxy:latest .
docker run -e PROXY_TOKEN=your-token -p 3000:3000 uhuh-playwright-proxy:latest
```

## Security notes
- This is a scaffold. Do NOT run exposed to the public internet without additional protections:
  - Use a strong token and TLS.
  - Add authentication, allowlisting, and logging safeguards.
  - Limit resource usage and add monitoring.

## Next steps
- Add pooled contexts instead of creating/closing for every request.
- Add browser selection (Chromium/Firefox/WebKit) and per-user sessions.
- Implement streaming responses and smart content rewriting if needed.
