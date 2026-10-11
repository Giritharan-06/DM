import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [name, width, height, url] of [
    ['website-desktop', 1440, 1000, 'http://localhost:3000'],
    ['website-mobile', 390, 844, 'http://localhost:3000'],
    ['crm-signin', 1440, 1000, 'http://localhost:3001/sign-in'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('img').evaluateAll((images) =>
      images.forEach((image) => {
        image.loading = 'eager';
      }),
    );
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
    await page.screenshot({ path: `artifacts/viewport-${name}.png` });
    const problems = await page.evaluate(() => ({
      horizontalOverflow:
        document.documentElement.scrollWidth > window.innerWidth,
    }));
    console.log(name, problems);
    await page.close();
  }
} finally {
  await browser.close();
}
