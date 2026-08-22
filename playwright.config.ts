import { defineConfig } from '@playwright/test';

// Not part of `npm test`/`lint:ci` and not wired into .github/workflows/ci.yml on purpose: these drive a real
// browser against the docs site to check things vitest's jsdom environment cannot (actual CSS layout/paint,
// hover-revealed resize handles, a genuine `paste` DOM event). Run by hand with `npm run test:e2e`.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  webServer: {
    command: 'npm run docs:dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
