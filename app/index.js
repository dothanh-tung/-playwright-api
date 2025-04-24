import express from 'express';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const app = express();
app.use(express.json());
chromium.use(StealthPlugin());

const proxyList = ['http://user:pass@proxy1.com:8000', 'http://proxy2.com:8080'];
function getRandomProxy() {
  const idx = Math.floor(Math.random() * proxyList.length);
  return proxyList[idx];
}

app.post('/fetch', async (req, res) => {
  const {
    url,
    waitUntil = 'domcontentloaded',
    headers = {},
    cookies = [],
    proxy = null,
    screenshot = false,
    pdf = false,
    timezone = 'Asia/Ho_Chi_Minh'
  } = req.body;

  let proxyUsed = null;
  if (proxy === 'random') proxyUsed = getRandomProxy();
  else if (proxy) proxyUsed = proxy;

  const browser = await chromium.launch({
    headless: true,
    proxy: proxyUsed ? { server: proxyUsed } : undefined
  });

  const context = await browser.newContext({
    timezoneId: timezone,
    locale: 'vi-VN',
    userAgent: headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  });

  const page = await context.newPage();
  if (headers) await page.setExtraHTTPHeaders(headers);
  if (cookies.length) await context.addCookies(cookies);

  const start = Date.now();
  let statusCode = 0;
  const result = {
    proxy: proxyUsed || 'none',
    responseTimeMs: 0,
    html: '',
  };

  try {
    const response = await page.goto(url, { waitUntil });
    statusCode = response.status();

    result.statusCode = statusCode;
    result.responseTimeMs = Date.now() - start;
    result.html = await page.content();

    if (screenshot) {
      const path = `/tmp/${uuidv4()}.png`;
      await page.screenshot({ path, fullPage: true });
      result.screenshot = path;
      setTimeout(() => fs.unlink(path).catch(() => {}), 10000);
    }

    if (pdf) {
      const path = `/tmp/${uuidv4()}.pdf`;
      await page.pdf({ path, format: 'A4' });
      result.pdf = path;
      setTimeout(() => fs.unlink(path).catch(() => {}), 10000);
    }

    await browser.close();
    res.json(result);
  } catch (err) {
    await browser.close();
    res.status(500).json({
      error: err.message,
      proxy: proxyUsed || 'none',
      responseTimeMs: Date.now() - start
    });
  }
});

app.listen(3000, () => console.log('Playwright API running at http://localhost:3000'));
