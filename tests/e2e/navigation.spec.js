const { test, expect } = require('@playwright/test');

test('brand and back-to-top fragment navigation focus the hero and clear temporary tabindex on blur', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#top');
  const links = [page.getByRole('link', { name: 'Atabak Nikouseresht — home', exact: true }), page.locator('footer a[href="#top"]')];
  for (const link of links) {
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#top$/);
    await expect(hero).toBeFocused();
    await expect(hero).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Tab');
    await expect(hero).not.toHaveAttribute('tabindex', '-1');
  }
});

test('mobile navigation remains usable when the deferred script fails to load', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.route('**/script.js', (route) => route.abort());
  for (const path of ['/', '/projects/fraud-risk/']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#site-nav')).toBeVisible();
    await expect(page.locator('#site-nav a')).toHaveCount(5);
    await expect(page.locator('#menu-toggle')).toBeHidden();
    await expect(page.locator('#site-nav a').first()).toBeEnabled();
  }
});

test('no-JavaScript mobile navigation exposes all sections without a dead menu button', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#site-nav')).toBeVisible();
  await expect(page.locator('#site-nav a')).toHaveCount(5);
  await expect(page.locator('#menu-toggle')).toBeHidden();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
  await context.close();
});

test('mobile menu keyboard focus, Escape and sticky-header anchor offset work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#theme-toggle').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#menu-toggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-toggle')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Research', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#research$/);
  await expect(page.locator('#research')).toBeFocused();
  const anchorPosition = await page.locator('#research').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
  }));
  expect(anchorPosition.top).toBeGreaterThanOrEqual(anchorPosition.headerBottom - 1);
});

test('section targets return to the normal tab order after programmatic focus moves away', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Research', exact: true }).click();
  const target = page.locator('#research');
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Tab');
  await expect(target).not.toHaveAttribute('tabindex', '-1');
});

test('fragment back and forward navigation returns focus to the active section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Research', exact: true }).click();
  await expect(page.locator('#research')).toBeFocused();
  await page.goBack();
  await page.goForward();
  await expect(page).toHaveURL(/#research$/);
  await expect(page.locator('#research')).toBeFocused();
});

test('case-study navigation returns to the homepage section with its target visible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/projects/fraud-risk/');
  await page.getByRole('link', { name: /all projects/i }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('#work')).toBeFocused();
  const targetPosition = await page.locator('#work').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
  }));
  expect(targetPosition.top).toBeGreaterThanOrEqual(targetPosition.headerBottom - 1);
});

test('case-study section navigation focuses the destination below the sticky header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/fraud-risk/');
  const link = page.locator('.case-toc a[href="#review-capacity"]');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#review-capacity$/);
  await expect(page.locator('#review-capacity')).toBeFocused();
  const position = await page.locator('#review-capacity').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
  }));
  expect(position.top).toBeGreaterThanOrEqual(position.headerBottom - 1);
});

test('system theme is respected, manual choice persists, and blocked storage does not break controls', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();

  const darkContext = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 900 } });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('/');
  await expect(darkPage.locator('html')).toHaveAttribute('data-theme', 'dark');
  await darkContext.close();

  const blockedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blockedContext.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('Storage denied', 'SecurityError'); },
    });
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto('/');
  await expect(blockedPage.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
  await blockedPage.locator('#theme-toggle').click();
  await expect(blockedPage.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
  await expect(blockedPage.locator('#menu-toggle')).toBeVisible();
  await blockedContext.close();
});
