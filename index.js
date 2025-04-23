const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json({ limit: '10mb' }));

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function initBrowser() {
  return await chromium.launch({ args: ['--no-sandbox'] });
}

app.post('/fetch', async (req, res) => {
  const { url, waitUntil = 'domcontentloaded' } = req.body;
  if (!url) return res.status(400).send('Missing URL');
  const browser = await initBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(DEFAULT_UA);
    await page.goto(url, { waitUntil, timeout: 60000 });
    await page.waitForTimeout(5000);
    const html = await page.content();
    await browser.close();
    res.send({ html });
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.post('/screenshot', async (req, res) => {
  const { url, fullPage = true } = req.body;
  if (!url) return res.status(400).send('Missing URL');
  const browser = await initBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(DEFAULT_UA);
    await page.goto(url, { waitUntil: 'networkidle' });
    const buffer = await page.screenshot({ fullPage });
    await browser.close();
    res.set('Content-Type', 'image/png').send(buffer);
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.post('/pdf', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send('Missing URL');
  const browser = await initBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(DEFAULT_UA);
    await page.goto(url, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    res.set('Content-Type', 'application/pdf').send(pdf);
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.post('/extract', async (req, res) => {
  const { url, selector } = req.body;
  if (!url || !selector) return res.status(400).send('Missing url or selector');
  const browser = await initBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(DEFAULT_UA);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await page.$$eval(selector, els => els.map(e => e.textContent.trim()));
    await browser.close();
    res.send({ selector, results: content });
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Playwright API with custom User-Agent ready at http://localhost:3000');
});
