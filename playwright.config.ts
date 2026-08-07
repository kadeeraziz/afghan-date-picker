import { defineConfig, devices } from '@playwright/test';

const PORT = 4311;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'test/browser',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /desktop\.spec\.ts/
    },
    {
      name: 'chromium-mobile-320x400',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 400 }
      },
      testMatch: /mobile\.spec\.ts/
    }
  ],
  webServer: {
    command: `node test/browser/helpers/server.mjs --port ${PORT}`,
    url: `${BASE_URL}/test/browser/fixtures/picker.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});