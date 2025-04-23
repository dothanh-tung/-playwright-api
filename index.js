const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json({ limit: '10mb' }));

async function initBrowser() {
  return await chromium.launch({ args: ['--no-sandbox'] });
}

app.post('/fetch', async (req, res) => {
  const { url, waitUntil = 'networkidle' } = req.body;
  if (!url) return res.status(400).send('Missing URL');

  const browser = await initBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil, timeout: 60000 });
    const html = await page.content();
    await browser.close();
    res.send(html);
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
    await page.goto(url, { waitUntil: 'networkidle' });
    const content = await page.$$eval(selector, els => els.map(e => e.textContent.trim()));
    await browser.close();
    res.send({ selector, results: content });
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Playwright API ready at http://localhost:3000');
});
