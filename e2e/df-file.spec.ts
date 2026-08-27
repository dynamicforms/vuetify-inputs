import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-file');
  await page.waitForSelector('.df-input-wrapper');
});

test('clicking the field opens the native file chooser', async ({ page }) => {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('.df-input-wrapper');
  const chooser = await chooserPromise;

  expect(chooser.isMultiple()).toBe(false);
});

test('dropping a file uploads it and clears the drag highlight', async ({ page }) => {
  const input = page.locator('.df-input-wrapper input[type="file"]');
  await input.dispatchEvent('dragover');

  const fileInput = page.locator('.v-file-input');
  await expect(fileInput).toHaveClass(/v-file-input--dragging/);

  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['hello'], 'sample.txt', { type: 'text/plain' }));
    return dt;
  });
  await input.dispatchEvent('drop', { dataTransfer });

  await expect(fileInput).not.toHaveClass(/v-file-input--dragging/);
  await expect(page.locator('.df-input-wrapper .v-field__input')).toContainText('sample.txt', { timeout: 10000 });
});
