import { test, expect } from '@playwright/test';
test('cards use distinct artwork and industry options have matching illustrations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const sources = await page
    .locator('main img, .site-footer .card-art img')
    .evaluateAll((images) =>
      images.map((image) => {
        const url = new URL((image as HTMLImageElement).src);
        return url.searchParams.get('url') || url.pathname;
      }),
    );
  expect(new Set(sources).size).toBe(sources.length);
  const industrySources = new Set<string>();
  for (const industry of [
    'Restaurant',
    'Clothing Store',
    'Salon',
    'Gym',
    'Real Estate',
    'Education',
    'Healthcare',
    'Other',
  ]) {
    await page.getByRole('tab', { name: industry, exact: true }).click();
    const src = await page.locator('.industry-art img').getAttribute('src');
    expect(industrySources.has(src!)).toBe(false);
    industrySources.add(src!);
  }
  const goalSources = new Set<string>();
  for (const goal of [
    'More enquiries',
    'A stronger brand',
    'A better website',
  ]) {
    await page.getByRole('button', { name: goal, exact: true }).click();
    const src = await page.locator('.finder-card img').getAttribute('src');
    expect(goalSources.has(src!)).toBe(false);
    goalSources.add(src!);
  }
});
test('footer service links reach the matching artwork cards', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer.locator('.social-link')).toHaveCount(4);
  await footer
    .getByRole('link', { name: 'Website Development', exact: true })
    .click();
  const card = page.locator('#service-5');
  await expect(
    card.getByRole('heading', { name: 'Website Development' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      card
        .locator('img')
        .evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await card.getByRole('button', { name: 'Learn more' }).click();
  await expect(
    card.getByRole('link', { name: 'Discuss website development →' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test('industry selector updates the strategy', async ({ page }) => {
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole('tab', { name: 'Gym', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText(
    'membership enquiries',
  );
});
test('consultation form rejects incomplete submissions', async ({ page }) => {
  await page.goto('/#consultation');
  await page
    .getByRole('button', { name: 'Get My Free Consultation', exact: true })
    .click();
  await expect(page.getByRole('alert')).not.toHaveCount(0);
  await expect(
    page.getByText('Please consent to being contacted.'),
  ).toBeVisible();
});
test('reduced motion keeps the story and form accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Turn Your Business Into a Growth Story.',
    }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Get Free Consultation', exact: true })
    .click();
  await expect(page.getByLabel('Your name', { exact: true })).toBeVisible();
  expect(
    await page
      .locator('.transformation')
      .evaluate((el) => getComputedStyle(el).position),
  ).not.toBe('fixed');
});
test('sign-in is responsive without horizontal overflow', async ({ page }) => {
  await page.goto('http://localhost:3001/sign-in');
  await expect(
    page.getByRole('heading', { name: 'Your workspace awaits.' }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
test('public API rejects invalid enquiries', async ({ request }) => {
  const res = await request.post('/api/public/leads', {
    headers: { origin: 'http://localhost:3000' },
    data: { name: 'invalid' },
  });
  expect(res.status()).toBe(400);
});

test('artwork loads and FAQ answers expand', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(() =>
      page
        .locator('.hero-illustration')
        .evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  const question = page.getByText('Which service should I start with?', {
    exact: true,
  });
  await question.click();
  await expect(
    page.getByText('A consultation helps us recommend', { exact: false }),
  ).toBeVisible();
  await question.click();
  await expect(
    page.getByText('A consultation helps us recommend', { exact: false }),
  ).not.toBeVisible();
});

test('desktop scroll changes the pinned studio chapters', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Mobile presents the chapters as regular content.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.signature-stage').locator('..')).toHaveClass(
    /pin-spacer/,
  );
  const target = await page
    .locator('.signature-stage')
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY + 850);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    target,
  );
  await expect
    .poll(() =>
      page
        .locator('.signature-performance')
        .evaluate((el) => (el as HTMLElement).inert),
    )
    .toBe(false);
  await expect(page.locator('.signature-stage')).toHaveCSS('position', 'fixed');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test('business goals update the recommended direction', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'A better website', exact: true })
    .click();
  await expect(page.locator('.finder-card')).toContainText(
    'Make every visit feel effortless.',
  );
  await expect(page.locator('.finder-card')).toContainText('SEO foundations');
});

test('contact options support keyboard dismissal', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', {
    name: 'Start a conversation',
    exact: true,
  });
  test.skip(
    (await button.count()) === 0,
    'Configured WhatsApp uses a direct chat link.',
  );
  await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', { name: 'Get a free consultation' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('mobile menu exposes the growth plan option', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile navigation only.');
  await page.goto('/');
  await page.getByLabel('Open website menu').click();
  await expect(
    page
      .locator('.mobile-menu-web')
      .getByRole('link', { name: 'Find your plan' }),
  ).toBeVisible();
  await page
    .locator('.mobile-menu-web')
    .getByRole('link', { name: 'Find your plan' })
    .click();
  await expect(
    page.getByRole('group', { name: 'Choose your business goal' }),
  ).toBeVisible();
});
