import { expect, type Page, test } from '@playwright/test';

const basicSelect = (page: Page) => page.locator('.demo-container').first().locator('.v-input').first();

async function pickFruits(page: Page) {
  // until it renders in the browser, the select is a read-only text field
  await expect(basicSelect(page)).toHaveClass(/v-autocomplete/);
  await basicSelect(page).locator('.v-field').click();
  for (const fruit of ['Apple', 'Banana', 'Durian', 'Elderflower']) {
    await page.locator('.v-overlay-container .v-list-item', { hasText: fruit }).first().click();
  }
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
}

test('wrapped chips stack the clear button above the arrow; a wider field puts them on one row', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto('/examples/df-select');
  await pickFruits(page);
  await expect(basicSelect(page)).toHaveClass(/df-select-multirow/);

  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(basicSelect(page)).not.toHaveClass(/df-select-multirow/);

  await page.setViewportSize({ width: 480, height: 900 });
  await expect(basicSelect(page)).toHaveClass(/df-select-multirow/);
});

test('the layout settles at every width', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto('/examples/df-select');
  await pickFruits(page);

  for (let width = 760; width >= 440; width -= 4) {
    await page.setViewportSize({ width, height: 900 });
    const classes = await basicSelect(page).evaluate(async (el) => {
      const seen: boolean[] = [];
      for (let frame = 0; frame < 6; frame++) {
        await new Promise(requestAnimationFrame);
        seen.push(el.classList.contains('df-select-multirow'));
      }
      return seen;
    });
    expect(new Set(classes.slice(2)).size, `width ${width}: ${classes}`).toBe(1);
  }
});
