import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390, 768]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.locator('img').evaluateAll((images) =>
      images.forEach((image) => {
        image.loading = 'eager';
      }),
    );
    await page.waitForFunction(() =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    for (const [name, selector] of [
      ['cards', '#services'],
      ['footer', '.site-footer'],
      ['digital-studio', '.signature-digital'],
      ['case-concepts', '#work'],
    ]) {
      await page
        .locator(selector)
        .screenshot({ path: `artifacts/${name}-${width}.png` });
    }
    console.log(
      width,
      await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        footerSocialIcons: document.querySelectorAll(
          '.site-footer .social-link',
        ).length,
      })),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
