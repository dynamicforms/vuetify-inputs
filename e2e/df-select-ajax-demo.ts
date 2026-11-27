import { type Page } from '@playwright/test';

// the 'Dynamic options loading' demo on /examples/df-select

// the demo's fake server answers each fetch after 3000 ms
export const FETCH = { timeout: 10000 };

export const MIN_QUERY_TEXT = 'Type at least two letters of the language name.';
export const NO_DATA_TEXT = 'No languages found.';

export const demo = (page: Page) => page.locator('.demo-container', { has: page.getByText('Dynamic options loading') });

export const minimumQueryCheckbox = (page: Page) =>
  demo(page).getByRole('checkbox', { name: 'Minimum query of two letters' });
