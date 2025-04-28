const { test } = require('@playwright/test');
const fs = require('fs').promises;

test('Get HTML of Forex Factory Calendar', async ({ page }) => {
  await page.goto('https://www.forexfactory.com/calendar', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(5000);
  const htmlContent = await page.content();

  const outputPath = 'output/forexfactory.html';
  await fs.mkdir('output', { recursive: true });
  await fs.writeFile(outputPath, htmlContent);

  console.log(`HTML saved to ${outputPath}`);
});