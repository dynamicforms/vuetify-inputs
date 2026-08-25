import path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '@playwright/test';

const dirname = fileURLToPath(new URL('.', import.meta.url));

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-image');
  await page.waitForSelector('.df-image-wrapper');
});

test('clicking the placeholder opens the native file chooser', async ({ page }) => {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('.df-image-placeholder');
  const chooser = await chooserPromise;

  expect(chooser.isMultiple()).toBe(false);
});

test('a large image is scaled to the field instead of cropped, and the field does not grow past its own bounds', async ({
  page,
}) => {
  const wrapper = page.locator('.df-image-wrapper');
  const boxBefore = await wrapper.boundingBox();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('.df-image-placeholder');
  const chooser = await chooserPromise;
  await chooser.setFiles(path.join(dirname, 'fixtures', 'large-portrait.png'));

  const img = page.locator('.df-image-preview img');
  await expect(img).toBeVisible();
  await expect(img).toHaveJSProperty('complete', true);

  const boxAfter = await wrapper.boundingBox();
  expect(boxAfter!.height).toBeCloseTo(boxBefore!.height, 0);

  await expect(img).toHaveCSS('object-fit', 'contain');

  // the field's own bounds must not creep into the next control (regression: the field used to grow to the
  // uploaded image's natural size and visually cover whatever followed it)
  const disableButton = page.getByRole('button', { name: /disable field/i });
  const disableBox = await disableButton.boundingBox();
  expect(disableBox!.y).toBeGreaterThanOrEqual(boxAfter!.y + boxAfter!.height);
});

test('replacing an existing image opens the file chooser from the overlay button', async ({ page }) => {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('.df-image-placeholder');
  const chooser = await chooserPromise;
  await chooser.setFiles(path.join(dirname, 'fixtures', 'large-portrait.png'));

  await expect(page.locator('.df-image-preview img')).toBeVisible();

  const replaceChooserPromise = page.waitForEvent('filechooser');
  await page.click('.df-image-replace-btn');
  const replaceChooser = await replaceChooserPromise;

  expect(replaceChooser.isMultiple()).toBe(false);
});
