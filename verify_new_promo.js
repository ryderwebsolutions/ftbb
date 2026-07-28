const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://localhost:9040/index.html');
  await page.waitForTimeout(3400);
  await page.screenshot({ path: 'C:/ftbb/np_visible.png' });

  const heroTop = await page.evaluate(() => document.querySelector('.hero').getBoundingClientRect().top);
  console.log('hero top (should be near 0, unaffected):', heroTop);

  console.log('errors:', errors);
  await browser.close();
})();
