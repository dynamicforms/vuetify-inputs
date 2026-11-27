import { expect, test } from './test';

import { dropFile, openFileChooser } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-file');
  await page.waitForSelector('.df-input-wrapper');
});

test('clicking the field opens the native file chooser', async ({ page }) => {
  const chooser = await openFileChooser(page, '.df-input-wrapper');

  expect(chooser.isMultiple()).toBe(false);
});

test('dropping a file uploads it and clears the drag highlight', async ({ page }) => {
  const input = page.locator('.df-input-wrapper input[type="file"]');
  await input.dispatchEvent('dragover');

  const fileInput = page.locator('.v-file-input');
  await expect(fileInput).toHaveClass(/v-file-input--dragging/);

  await dropFile(page, input, { name: 'sample.txt', type: 'text/plain', text: 'hello' });

  await expect(fileInput).not.toHaveClass(/v-file-input--dragging/);
  await expect(page.locator('.df-input-wrapper .v-field__input')).toContainText('sample.txt', { timeout: 10000 });
});
