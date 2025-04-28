const express = require('express');
const { chromium } = require('playwright');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/get-html', async (req, res) => {
  let browser;
  try {
    const url = req.query.url || 'https://www.forexfactory.com/calendar';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL. URL must start with http:// or https://' });
    }

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);
    const htmlContent = await page.content();
    res.json({ html: htmlContent });
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