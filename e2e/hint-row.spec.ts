import { expect, test } from '@playwright/test';

// bottom of each field's outermost control on the row whose columns stretch their fields, one of which has a hint
function controlBottoms(page: import('@playwright/test').Page) {
  return page
    .locator('.hint-row')
    .evaluate((row) => [...row.querySelectorAll(':scope > .v-col')].map((col) =>
      Math.round(col.querySelector('.v-field')!.getBoundingClientRect().bottom),
    ),
  );
}

for (const variant of ['outlined', 'underlined', 'plain']) {
  test(`a hint on one field leaves the controls of the row level, ${variant}`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('/examples/density');
    await page.locator('.density-demo .v-field').first().click();
    await page.locator('.v-overlay-container .v-list-item', { hasText: new RegExp(`^${variant}$`, 'i') }).click();
    await expect(page.locator('.hint-row .v-field').first()).toHaveClass(new RegExp(`v-field--variant-${variant}`));
    await expect(page.locator('.hint-row .v-messages')).toContainText('A hint long enough');

    const bottoms = await controlBottoms(page);
    expect(bottoms).toHaveLength(4);
    expect(new Set(bottoms).size).toBe(1);
  });
}
