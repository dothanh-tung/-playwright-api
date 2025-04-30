const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

// Helper function to add a delay in Puppeteer
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

puppeteer.use(StealthPlugin());

app.use(express.json());

app.use('/get-html', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

app.get('/get-html', async (req, res) => {
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

    browser = await puppeteer.launch({
      headless: true, // Change to boolean for compatibility
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 90000,
    });

    await delay(10000);

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