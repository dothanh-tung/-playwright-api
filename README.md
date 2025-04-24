# Playwright Stealth API (Dockerized)

This is a stealth-ready HTML scraping API using Playwright, Docker, and Express.

## Features

- Stealth mode (bypass bot protection)
- Proxy support (fixed or random)
- Custom headers/cookies
- Screenshot + PDF options
- Timezone spoofing (e.g. GMT+7)
- Auto-cleanup for temp files

## Run locally

```bash
docker compose up --build
```

## Sample Payload

```json
{
  "url": "https://example.com",
  "screenshot": true,
  "pdf": true,
  "proxy": "random",
  "timezone": "Asia/Ho_Chi_Minh"
}
```
