const express = require('express');
const { chromium } = require('playwright-extra');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

app.use(express.json());

app.use('/fetch', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

app.get('/fetch', async (req, res) => {
  let browser;
  try {
    const url = req.query.url || 'https://www.forexfactory.com/calendar';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL. URL must start with http:// or https://' });
    }

    const apiKey = req.query.apiKey;
    if (apiKey !== 'your-secret-key') {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    browser = await chromium.launch({
      headless: 'new', // Use the new headless mode to reduce detection
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'Asia/Bangkok',
      javaScriptEnabled: true,
      bypassCSP: true,
    });

    // Manual stealth techniques
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      window.chrome = { runtime: {} };
    });

    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 90000,
    });

    await page.waitForTimeout(10000);
    const htmlContent = await page.content();

    res.json({
      html: htmlContent,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: `Failed to fetch HTML: ${error.message}` });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});