import { defineConfig } from '@playwright/test';

// Drives a real browser against the built docs site, which has no dev-server dependency pre-bundling delay.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  webServer: {
    command: 'npm run docs:build && npm run docs:preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
});
