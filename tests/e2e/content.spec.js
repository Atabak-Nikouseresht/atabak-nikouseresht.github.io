const { test, expect } = require('@playwright/test');

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

test('homepage keeps the full review-budget chart on the dedicated case-study page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#work .project-featured .review-budget-figure')).toHaveCount(0);
  await expect(page.locator('#work .project-featured .metrics')).toBeVisible();
  await expect(page.locator('#work .project-featured a[href="/projects/fraud-risk/"]').first()).toBeVisible();
  await page.goto('/projects/fraud-risk/');
  await expect(page.locator('#review-capacity .review-budget-figure')).toBeVisible();
});

test('secondary project cards use concise Problem, Approach and Outcome summaries', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#work > .container > .project-grid > article.project-card:not(.project-featured)');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const labels = (await card.locator('dt').allTextContents()).map(normalize);
    expect(labels).toEqual(['Problem', 'Approach', 'Outcome']);
    await expect(card.locator('.tags')).toBeVisible();
    await expect(card.getByText('Professional relevance', { exact: true })).toHaveCount(0);
    await expect(card.getByText('Tools', { exact: true })).toHaveCount(0);
  }
});

test('secondary project cards remain readable in the desktop grid and tablet stack', async ({ page }) => {
  await page.goto('/');
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.locator('#work .project-grid').evaluate((grid) => ({
      columns: getComputedStyle(grid).gridTemplateColumns.trim().split(' ').length,
      cards: [...grid.querySelectorAll(':scope > article.project-card:not(.project-featured)')].map((card) => ({
        width: card.getBoundingClientRect().width,
        clientWidth: card.clientWidth,
        scrollWidth: card.scrollWidth,
        descriptions: [...card.querySelectorAll('.project-facts dd')].map((description) => ({
          width: description.getBoundingClientRect().width,
          clientWidth: description.clientWidth,
          scrollWidth: description.scrollWidth,
        })),
      })),
    }));
    expect(layout.cards).toHaveLength(3);
    expect(layout.columns, `project grid columns at ${width}px`).toBe(width > 1080 ? 3 : 1);
    for (const card of layout.cards) {
      expect(card.width, `card width at ${width}px`).toBeGreaterThan(width > 1080 ? 350 : 900);
      expect(card.scrollWidth, `card overflow at ${width}px`).toBeLessThanOrEqual(card.clientWidth + 1);
      for (const description of card.descriptions) {
        expect(description.width, `fact text width at ${width}px`).toBeGreaterThan(120);
        expect(description.scrollWidth, `fact text overflow at ${width}px`).toBeLessThanOrEqual(description.clientWidth + 1);
      }
    }
  }
});

test('Portfolio Theory reproducibility is described as evidence status, not as a tool', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#work article.project-card').filter({ has: page.getByRole('heading', { name: 'Portfolio Theory & Asset Allocation' }) });
  await card.locator('details summary').click();
  const text = normalize(await card.locator('details').innerText());
  expect(text).toMatch(/evidence status/i);
  expect(text).toMatch(/no runnable source code or input data/i);
  expect(text).toMatch(/not (?:been )?independently reproduced/i);
});

test('Research names the thesis topic, current evidence and ongoing design stage', async ({ page }) => {
  await page.goto('/');
  const text = normalize(await page.locator('#research').innerText());
  expect(text).toMatch(/digitalization risk in (European )?banking/i);
  expect(text).toMatch(/tokenization|digital assets/i);
  expect(text).toMatch(/public bank disclosures and documented bank-level digitalization events/i);
  expect(text).toMatch(/current stage/i);
  expect(text).toMatch(/defining the sample, outcomes and empirical design/i);
  expect(text).toMatch(/no empirical results are reported yet/i);
});

test('ongoing internship wording describes scope without claiming delivered screening outcomes', async ({ page }) => {
  await page.goto('/');
  const role = page.locator('#experience .timeline-item').filter({ has: page.getByRole('heading', { name: 'Curricular Intern' }) });
  const text = normalize(await role.innerText());
  expect(text).toMatch(/Oct 2026.*Present/i);
  expect(text).toMatch(/internship ongoing/i);
  expect(text).toMatch(/current scope includes/i);
  expect(text).not.toMatch(/completed screening|delivered screening results|achieved.*feasibility/i);
});
