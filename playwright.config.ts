import { defineConfig } from '@playwright/test';

// Separate from `npm test`/`lint:ci` and run as its own `e2e` job in .github/workflows/ci.yml: these drive a
// real browser against the docs site to check things vitest's jsdom environment cannot (actual CSS layout/paint,
// hover-revealed resize handles, a genuine `paste` DOM event, real bubbling drag events). Run locally by hand
// with `npm run test:e2e`.
//
// Served from the built site rather than `docs:dev`: a dev server pre-bundles its whole dependency graph
// (Vuetify, TipTap, date-fns, ...) on first navigation, which a CI runner can take well past a reasonable test
// timeout to finish; the built site has no such warm-up cost.
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
