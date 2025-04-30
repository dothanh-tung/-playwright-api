# Playwright Cloudflare Stack

This repository contains a Dockerized Playwright stack to fetch HTML from websites protected by Cloudflare, such as `https://www.forexfactory.com/calendar`. The stack runs an Express server with an API endpoint and uses `playwright-extra/stealth` to bypass bot detection.

## Prerequisites
- Docker and Portainer installed on the server.
- GitHub account.
- n8n or another tool to call the API.

## Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/playwright-cloudflare.git
   cd playwright-cloudflare
   ```

2. **Deploy in Portainer**:
   - Go to **Stacks** > **Add stack**.
   - Select **Repository** method.
   - Set:
     - Repository URL: `https://github.com/<your-username>/playwright-cloudflare.git`
     - Compose path: `docker-compose.yml`
   - Deploy the stack.

3. **Test the API**:
   ```bash
   curl "http://<your-server-ip>:3000/get-html?url=https://www.forexfactory.com/calendar&apiKey=your-secret-key"
   ```

## API Endpoint
- **URL**: `http://<your-server-ip>:3000/get-html`
- **Method**: GET
- **Query Parameters**:
  - `url`: Target URL (e.g., `https://www.forexfactory.com/calendar`)
  - `apiKey`: Secret key (default: `your-secret-key`)
- **Response**:
  ```json
  {
    "html": "<html>...</html>",
    "timestamp": "5/1/2025, 3:45:32 PM"
  }
  ```

## Notes
- The stack uses UTC+7 (Asia/Bangkok) timezone.
- Rate limiting: 100 requests per 15 minutes.
- Replace `your-secret-key` in `server.js` with a secure key.

## Troubleshooting
- **Cloudflare blocks**: Try `headless: 'new'` in `server.js` or integrate a proxy.
- **Port conflicts**: Change the port in `docker-compose.yml` and `server.js`.