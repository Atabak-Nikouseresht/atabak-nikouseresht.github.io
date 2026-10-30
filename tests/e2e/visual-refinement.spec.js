const { test, expect } = require("@playwright/test");

const coverSources = [
  "/assets/project-covers/ieee-cis.webp",
  "/assets/project-covers/portfolio-theory.webp",
  "/assets/project-covers/hermes-crypto-lab.webp",
  "/assets/project-covers/investment-deflator.webp",
  "/assets/project-covers/education-highskill.webp",
  "/assets/project-covers/hermes-obsidian-retrieval.webp",
];

// The supplied app cover embeds stale/unverified metrics; retain the genuine local UI preview instead.

test("homepage hero is compact and gets to flagship visual evidence sooner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-proof")).toHaveCount(0);
  const heroHeight = await page
    .locator("#top")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(heroHeight).toBeGreaterThan(716);
  expect(heroHeight).toBeLessThan(813);
  const flagshipCover = page.locator("#work .project-featured .project-cover img");
  await expect(flagshipCover).toBeVisible();
  expect(
    await flagshipCover.evaluate(
      (image) => new URL(image.getAttribute("src"), document.baseURI).pathname,
    ),
  ).toBe(coverSources[0]);
  await expect(page.locator("#work .project-featured .project-cover figcaption")).toContainText(
    /cover illustration/i,
  );
});

test("theme-switched wordmark variants keep transparent pixels and intrinsic dimensions", async ({
  page,
}) => {
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const logo = page.locator(`.brand img.brand-logo-${theme}`);
    await expect(logo).toBeVisible();
    const pixels = await logo.evaluate((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let visible = 0;
      for (let index = 3; index < data.length; index += 4) {
        if (data[index] === 0) transparent += 1;
        if (data[index] > 0) visible += 1;
      }
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        cornerAlpha: data[3],
        transparent,
        visible,
      };
    });
    expect(pixels.width).toBe(600);
    expect(pixels.height).toBe(152);
    expect(pixels.cornerAlpha).toBe(0);
    expect(pixels.transparent).toBeGreaterThan(0);
    expect(pixels.visible).toBeGreaterThan(0);
  }
});

test("all supplied project covers are responsive, named, lazy-loaded and decode", async ({
  page,
}) => {
  await page.goto("/");
  const additional = page.locator("#work details.supporting");
  await additional.locator(":scope > summary").click();
  const covers = page.locator("#work img[data-project-cover]");
  await expect(covers).toHaveCount(coverSources.length);
  for (const image of await covers.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0))
      .toBe(true);
  }
  const loaded = await covers.evaluateAll((images) =>
    images.map((image) => ({
      src: new URL(image.getAttribute("src"), document.baseURI).pathname,
      alt: image.getAttribute("alt"),
      width: image.getAttribute("width"),
      height: image.getAttribute("height"),
      loading: image.loading,
      objectFit: getComputedStyle(image).objectFit,
      srcset: image.getAttribute("srcset"),
      sizes: image.getAttribute("sizes"),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    })),
  );
  expect(loaded.map((image) => image.src).sort()).toEqual([...coverSources].sort());
  for (const image of loaded) {
    expect(image.alt).toBeTruthy();
    expect(Number(image.width)).toBeGreaterThan(0);
    expect(Number(image.height)).toBeGreaterThan(0);
    expect(image.loading).toBe("lazy");
    expect(image.objectFit).toBe("cover");
    expect(image.srcset).toContain("-320.webp 320w");
    expect(image.srcset).toContain("-640.webp 640w");
    expect(image.sizes).toBeTruthy();
    expect(image.complete).toBe(true);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.naturalHeight).toBeGreaterThan(0);
  }
  await expect(page.locator("#streamlit-preview img")).toHaveAttribute(
    "src",
    /fraud-detection-streamlit-preview\.webp$/,
  );
  await expect(page.locator("#streamlit-preview figcaption")).toContainText(
    /not a hosted service/i,
  );

  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const width of [320, 375, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        covers: [...document.querySelectorAll("#work img[data-project-cover]")].map((image) => {
          const rect = image.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        }),
      }));
      expect(layout.document, `page overflow at ${width}px (${theme})`).toBeLessThanOrEqual(
        layout.viewport,
      );
      if (width === 1440) {
        const expectedCover = "ieee-cis-640.webp";
        await expect
          .poll(() =>
            page
              .locator("#work .project-featured img[data-project-cover]")
              .evaluate((image) => image.currentSrc),
          )
          .toContain(expectedCover);
      }
      for (const cover of layout.covers) {
        expect(cover.left, `cover clipped left at ${width}px (${theme})`).toBeGreaterThanOrEqual(
          -1,
        );
        expect(cover.right, `cover clipped right at ${width}px (${theme})`).toBeLessThanOrEqual(
          width + 1,
        );
        expect(cover.width).toBeGreaterThan(0);
      }
    }
  }
});

test("responsive cover srcsets choose narrower files at mobile and desktop widths", async ({
  page,
}) => {
  const flagship = page.locator("#work .project-featured img[data-project-cover]");
  for (const { width, candidate } of [
    { width: 320, candidate: "ieee-cis-320.webp" },
    { width: 1440, candidate: "ieee-cis-640.webp" },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await flagship.scrollIntoViewIfNeeded();
    await expect.poll(() => flagship.evaluate((image) => image.currentSrc)).toContain(candidate);
  }
});

test("project-cover reveals are directional, and reduced motion keeps every image visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const coverFigures = page.locator("#work figure[data-reveal]");
  await expect(coverFigures).toHaveCount(coverSources.length + 1);
  const reducedStates = await coverFigures.evaluateAll((figures) =>
    figures.map((figure) => ({
      opacity: getComputedStyle(figure.querySelector("img")).opacity,
      transform: getComputedStyle(figure.querySelector("img")).transform,
      transitionDuration: getComputedStyle(figure.querySelector("img")).transitionDuration,
    })),
  );
  for (const state of reducedStates) {
    expect(state.opacity).toBe("1");
    expect(state.transform).toBe("none");
    expect(state.transitionDuration).toBe("0s");
  }

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const firstCover = page.locator('#work .project-featured figure[data-reveal="from-right"]');
  await expect(firstCover).toHaveClass(/reveal-pending/);
  const rightOffset = await firstCover
    .locator("img")
    .evaluate((image) => new DOMMatrix(getComputedStyle(image).transform).m41);
  expect(rightOffset).toBeGreaterThan(0);
  const leftCover = page.locator('#work figure#streamlit-preview[data-reveal="from-left"]');
  await expect(leftCover).toHaveClass(/reveal-pending/);
  const leftOffset = await leftCover
    .locator("img")
    .evaluate((image) => new DOMMatrix(getComputedStyle(image).transform).m41);
  expect(leftOffset).toBeLessThan(0);
  await firstCover.scrollIntoViewIfNeeded();
  await expect(firstCover).toHaveClass(/is-revealed/);
});

test("flagship case study starts with problem, result and decision relevance", async ({ page }) => {
  await page.goto("/projects/fraud-risk/");
  const summary = page.locator("#case-summary .case-executive-summary");
  await expect(summary).toBeVisible();
  await expect(summary.getByText("Problem", { exact: true })).toBeVisible();
  await expect(summary.getByText("Key result", { exact: true })).toBeVisible();
  await expect(summary.getByText("Why it matters", { exact: true })).toBeVisible();
  const text = (await summary.innerText()).replace(/\s+/g, " ");
  expect(text).toContain("0.870558");
  expect(text).toContain("0.028765");
  expect(text).toMatch(/1,182 alerts/);
  expect(text).toMatch(/retrospective/i);
  expect(text).not.toMatch(/production performance|proven savings/i);
});
