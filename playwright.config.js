const { defineConfig } = require('@playwright/test');

const port = 4173;
const python = process.platform === 'win32' ? 'python' : 'python3';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    actionTimeout: 5_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `${python} -m http.server ${port} --bind 127.0.0.1`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
