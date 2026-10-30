const { test, expect } = require('@playwright/test');

const caseUrl = '/projects/fraud-risk/';
const requestedWidths = [320, 375, 390, 768, 1024, 1280, 1440];

async function tableStates(page) {
  return page.locator('.case-table-scroll').evaluateAll((containers) =>
    containers.map((container) => {
      const ids = (container.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      const hints = ids.map((id) => document.getElementById(id)).filter(Boolean);
      return {
        label: container.getAttribute('aria-label'),
        clientWidth: container.clientWidth,
        scrollWidth: container.scrollWidth,
        overflow: container.scrollWidth > container.clientWidth + 1,
        tabIndex: container.tabIndex,
        describedBy: ids,
        hintVisible: hints.some((hint) => {
          const style = getComputedStyle(hint);
          return style.display !== 'none' && style.visibility !== 'hidden' && hint.getClientRects().length > 0;
        }),
      };
    }),
  );
}

test('result tables fit at desktop widths without nested horizontal scrolling', async ({ page }) => {
  await page.goto(caseUrl);
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const resultTables = await page.locator('#results .case-table-scroll').evaluateAll((containers) =>
      containers.map((container) => ({
        label: container.getAttribute('aria-label'),
        clientWidth: container.clientWidth,
        scrollWidth: container.scrollWidth,
      })),
    );
    expect(resultTables.filter((table) => table.scrollWidth > table.clientWidth + 1), `nested table scrolling at ${width}px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `page overflow at ${width}px`).toBe(true);
  }
});

test('case-study data tables expose captions, scoped headers, row labels and measured values', async ({ page }) => {
  await page.goto(caseUrl);
  const tables = page.locator('.case-table-scroll table');
  await expect(tables).toHaveCount(4);
  for (const table of await tables.all()) {
    await expect(table.locator('caption')).toHaveCount(1);
    expect(await table.locator('thead th[scope="col"]').count()).toBeGreaterThan(1);
    expect(await table.locator('tbody th[scope="row"]').count()).toBeGreaterThan(0);
    expect(await table.locator('tbody td').count()).toBeGreaterThan(0);
  }
  const values = (await tables.allTextContents()).join(' ');
  for (const value of ['0.887546', '0.480197', '0.870558', '0.656369', '0.004580', '354,324', '118,108']) {
    expect(values).toContain(value);
  }
});

test('scroll guidance matches actual overflow and narrow tables remain keyboard accessible', async ({ page }) => {
  await page.goto(caseUrl);
  for (const width of [...requestedWidths, 700, 760, 761, 800, 807, 808, 809, 810, 820]) {
    await page.setViewportSize({ width, height: 1000 });
    const states = await tableStates(page);
    for (const state of states) {
      expect(state.describedBy.length, `${state.label} lacks an accessible scroll hint reference at ${width}px`).toBeGreaterThan(0);
      expect(state.hintVisible, `${state.label} scroll guidance does not match overflow at ${width}px`).toBe(state.overflow);
      if (state.overflow) expect(state.tabIndex, `${state.label} is not keyboard focusable`).toBe(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `page overflow at ${width}px`).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('region', { name: 'Fixed review-budget results' })).toHaveCount(1);
  const scroller = page.locator('.case-table-scroll[aria-describedby="budget-table-hint"]');
  await scroller.focus();
  const before = await scroller.evaluate((element) => element.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
});
