const { test, expect } = require('@playwright/test');

const widths = [320, 375, 390, 768, 1024, 1280, 1440];
const pages = ['/', '/projects/fraud-risk/'];

for (const path of pages) {
  test(`${path} stays within the viewport in both themes at required widths`, async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        const state = await page.evaluate(() => ({
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));
        expect(state.documentWidth, `${path} document overflow at ${width}px (${theme})`).toBeLessThanOrEqual(state.viewportWidth);
        expect(state.bodyWidth, `${path} body overflow at ${width}px (${theme})`).toBeLessThanOrEqual(state.viewportWidth);
      }
    }
  });
}

test('200-percent zoom equivalent remains readable without page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    for (const path of pages) {
      await page.goto(path);
      const state = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(state.document, `${path} document overflow at 200% zoom equivalent (${theme})`).toBeLessThanOrEqual(state.viewport);
      expect(state.body, `${path} body overflow at 200% zoom equivalent (${theme})`).toBeLessThanOrEqual(state.viewport);
      await expect(page.locator('h1')).toBeVisible();
    }
  }
});

test('homepage CV download and case-study view links resolve to the preserved PDF', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('.hero-actions a[href="#work"]').click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('#work')).toBeFocused();
  await page.goto('/');
  const cvPath = '/assets/Atabak_Nikouseresht_Professional_Resume.pdf';
  const response = await request.get(cvPath);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const downloadUrl = new URL(await page.locator('a[download]').getAttribute('href'), page.url());
  expect(downloadUrl.pathname).toBe(cvPath);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('a[download]').click(),
  ]);
  expect(download.suggestedFilename()).toBe('Atabak_Nikouseresht_Professional_Resume.pdf');

  await page.goto('/projects/fraud-risk/');
  const viewCv = page.getByRole('link', { name: /view.*resume|view.*cv/i });
  const viewCvUrl = new URL(await viewCv.getAttribute('href'), page.url());
  expect(viewCvUrl.pathname).toBe(cvPath);
});

test('both page templates load and respond to controls without browser errors', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of pages) {
    await page.goto(path);
    await page.locator('#theme-toggle').click();
    await page.locator('#menu-toggle').click();
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('case-study evidence links target the intended repository artifacts', async ({ page }) => {
  await page.goto('/projects/fraud-risk/');
  const expected = [
    [/Repository/i, 'ieee-fraud-detection-xgboost'],
    [/Current evaluation/i, 'results/current_evaluation.md'],
    [/Authoritative JSON/i, 'results/current_evaluation.json'],
    [/Evaluation protocol/i, 'docs/phase2-evaluation.md'],
    [/Execution entry point/i, 'evaluation.py'],
  ];
  for (const [name, destination] of expected) {
    const link = page.locator('.case-source-card').filter({ hasText: name });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', expect.stringContaining(destination));
  }
});

test('essential text is readable, text links are identifiable, and focus/reduced-motion states remain visible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const homepageSizes = await page.evaluate(() => {
    const size = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
      projectLabel: size('.project-label'),
      factLabel: size('.project-facts dt'),
      factDescription: size('.project-facts dd'),
      textLink: size('.text-link'),
      researchStatus: size('.research-status'),
      evidenceUnderline: getComputedStyle(document.querySelector('.text-link')).textDecorationLine,
      heroUnderline: getComputedStyle(document.querySelector('.hero-links a')).textDecorationLine,
    };
  });
  expect(homepageSizes.projectLabel).toBeGreaterThanOrEqual(13);
  expect(homepageSizes.factLabel).toBeGreaterThanOrEqual(12);
  expect(homepageSizes.factDescription).toBeGreaterThanOrEqual(14);
  expect(homepageSizes.textLink).toBeGreaterThanOrEqual(14);
  expect(homepageSizes.researchStatus).toBeGreaterThanOrEqual(14);
  expect(homepageSizes.evidenceUnderline).toContain('underline');
  expect(homepageSizes.heroUnderline).toContain('underline');

  await page.keyboard.press('Tab');
  const focusState = await page.locator('.skip-link').evaluate((element) => ({
    focused: document.activeElement === element,
    outlineStyle: getComputedStyle(element).outlineStyle,
    outlineWidth: Number.parseFloat(getComputedStyle(element).outlineWidth),
  }));
  expect(focusState.focused).toBe(true);
  expect(focusState.outlineStyle).not.toBe('none');
  expect(focusState.outlineWidth).toBeGreaterThanOrEqual(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto');

  await page.goto('/projects/fraud-risk/');
  const caseSizes = await page.evaluate(() => {
    const size = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
      table: size('.case-table'),
      hint: size('.case-table-hint'),
      reviewRow: size('.review-budget-row'),
      tableOfContents: size('.case-toc a'),
    };
  });
  expect(caseSizes.table).toBeGreaterThanOrEqual(13);
  expect(caseSizes.hint).toBeGreaterThanOrEqual(13);
  expect(caseSizes.reviewRow).toBeGreaterThanOrEqual(13);
  expect(caseSizes.tableOfContents).toBeGreaterThanOrEqual(14);
});

test('axe-core smoke check passes on both page templates in light and dark themes', async ({ page }) => {
  const axePath = require.resolve('axe-core');
  for (const path of pages) {
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await page.addScriptTag({ path: axePath });
      const results = await page.evaluate(async () => window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      }));
      expect(results.violations.map(({ id, impact, description, nodes }) => ({
        id,
        impact,
        description,
        targets: nodes.map(({ target }) => target),
      })), `${path} axe violations in ${theme}`).toEqual([]);
    }
  }
});
