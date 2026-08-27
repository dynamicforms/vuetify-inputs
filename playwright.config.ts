import { defineConfig } from '@playwright/test';

// Separate from `npm test`/`lint:ci` and run as its own `e2e` job in .github/workflows/ci.yml: these drive a
// real browser against the docs site to check things vitest's jsdom environment cannot (actual CSS layout/paint,
// hover-revealed resize handles, a genuine `paste` DOM event, real bubbling drag events). Run locally by hand
// with `npm run test:e2e`.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  webServer: {
    command: 'npm run docs:dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
