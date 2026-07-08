const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'C:/ftbb/preview_top.png', fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/ftbb/preview_mid.png', fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/ftbb/preview_lower.png', fullPage: false });
  await browser.close();
  console.log('Done');
})();
