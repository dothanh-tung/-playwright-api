const express = require('express');
const { chromium } = require('playwright-extra');
const { StealthPlugin } = require('playwright-extra-plugin-stealth');

const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

// Áp dụng plugin stealth để chống phát hiện bot
chromium.use(StealthPlugin());

app.use(express.json());

// Giới hạn tần suất yêu cầu: 100 yêu cầu mỗi 15 phút
app.use('/fetch', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

app.get('/fetch', async (req, res) => {
  let browser;
  try {
    // Lấy URL từ query parameter
    const url = req.query.url || 'https://www.forexfactory.com/calendar';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL. URL must start with http:// or https://' });
    }

    // Kiểm tra API key (tùy chọn)
    const apiKey = req.query.apiKey;
    if (apiKey !== 'your-secret-key') {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Khởi động trình duyệt
    browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'Asia/Bangkok', // UTC+7
      javaScriptEnabled: true,
    });

    // Tắt Webdriver flag
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();

    // Truy cập URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 90000,
    });

    // Chờ thêm để vượt qua kiểm tra Cloudflare
    await page.waitForTimeout(10000);

    // Lấy nội dung HTML
    const htmlContent = await page.content();

    // Trả về HTML và thời gian lấy dữ liệu (UTC+7)
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