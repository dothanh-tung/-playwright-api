const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

// Helper function to add a delay in Puppeteer
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

puppeteer.use(StealthPlugin());

app.use(express.json());

// Rate limit cho tất cả các route
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

// API để lấy HTML
app.get('/fetch', async (req, res) => {
  let browser;
  try {
    const url = req.query.url || 'https://www.forexfactory.com/calendar';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL. URL must start with http:// or https://' });
    }

    const apiKey = req.query.apiKey;
    if (apiKey !== 'd7900480-1af7-41bb-abc8-98aa19f44782') {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    browser = await puppeteer.launch({
      headless: true,
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

// API để trích xuất JSON từ class hoặc id với Cheerio
app.get('/extract', async (req, res) => {
  let browser;
  try {
    const url = req.query.url || 'https://www.forexfactory.com/calendar';
    const className = req.query.class || 'calendar__table'; // Mặc định lấy class calendar__table
    const ids = req.query.id ? req.query.id.split(',') : []; // Hỗ trợ nhiều id, phân tách bằng dấu phẩy
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL. URL must start with http:// or https://' });
    }

    const apiKey = req.query.apiKey;
    if (apiKey !== 'd7900480-1af7-41b-abc8-98aa19f44782') {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    browser = await puppeteer.launch({
      headless: true,
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

    // Load HTML vào Cheerio
    const $ = cheerio.load(htmlContent);

    let extractedData = [];

    // Hàm trích xuất dữ liệu từ một phần tử
    const extractElementData = ($elem, isTable = false) => {
      const data = {};

      // Lấy tất cả các thuộc tính (attributes)
      const attributes = $elem[0].attribs || {};
      for (const [key, value] of Object.entries(attributes)) {
        data[`attr_${key}`] = value; // Đặt tiền tố 'attr_' để phân biệt với text
      }

      // Lấy nội dung text của phần tử
      data['text'] = $elem.text().trim() || "";

      // Lấy nội dung HTML của phần tử
      data['html'] = $elem.html() || "";

      // Nếu là bảng (calendar__table), trích xuất chi tiết hơn từ các hàng con
      if (isTable) {
        const rows = $elem.find('tr');
        const rowDataArray = [];
        rows.each((j, row) => {
          const $row = $(row);
          const rowData = {};

          // Lấy thuộc tính của hàng
          const rowAttrs = $row[0].attribs || {};
          for (const [key, value] of Object.entries(rowAttrs)) {
            rowData[`attr_${key}`] = value;
          }

          // Lấy nội dung từ các cột (td)
          $row.find('td').each((k, cell) => {
            const $cell = $(cell);
            const cellClasses = $cell.attr('class') || '';
            const cellText = $cell.text().trim() || '';
            if (cellClasses) {
              rowData[cellClasses.replace(/\s+/g, '_')] = cellText; // Chuyển class thành key
            }
            rowData[`cell_${k}_text`] = cellText; // Lưu text của từng cột
            rowData[`cell_${k}_html`] = $cell.html() || "";
          });

          rowDataArray.push(rowData);
        });
        data['rows'] = rowDataArray;
      }

      return data;
    };

    // Nếu có id, ưu tiên tìm theo id
    if (ids.length > 0) {
      for (const id of ids) {
        const $elem = $(`#${id}`);
        if ($elem.length > 0) {
          const isTable = $elem.hasClass('calendar__table');
          const data = extractElementData($elem, isTable);
          data['id'] = id; // Thêm id vào dữ liệu trả về
          extractedData.push(data);
        }
      }
    } else {
      // Nếu không có id, tìm theo class
      const elements = $(`.${className}`);
      elements.each((i, elem) => {
        const $elem = $(elem);
        const isTable = className === 'calendar__table';
        const data = extractElementData($elem, isTable);
        extractedData.push(data);
      });
    }

    // Nếu không tìm thấy dữ liệu
    if (extractedData.length === 0) {
      return res.status(404).json({ error: `No elements found for id(s): ${ids.join(', ') || 'none'} or class: ${className}` });
    }

    res.json({
      data: extractedData,
      class: className,
      ids: ids.length > 0 ? ids : null,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: `Failed to extract data: ${error.message}` });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});