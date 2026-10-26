import { expect, type Page, test } from '@playwright/test';

async function selectVariant(page: Page, variant: string) {
  await page.locator('.density-demo .v-field').first().click();
  await page.locator('.v-overlay-container .v-list-item', { hasText: new RegExp(`^${variant}$`, 'i') }).click();
  await expect(page.locator('.demo-grid .v-field').first()).toHaveClass(new RegExp(`v-field--variant-${variant}`, 'i'));
}

// vertical centre of the text in df-input and of the label of df-checkbox, and the heights of both, for every density
function measureRows(page: Page) {
  return page.locator('.demo-grid').evaluate((grid) => {
    const cells = [...grid.querySelectorAll('.component-cell')];
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      const input = cells[i].querySelector('input')!;
      const box = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      const top = box.top + parseFloat(style.paddingTop);
      const textCentre = (top + box.bottom - parseFloat(style.paddingBottom)) / 2;
      const range = document.createRange();
      range.selectNodeContents(cells[i + 2].querySelector('label')!);
      const label = range.getBoundingClientRect();
      rows.push({
        textCentre: Math.round(textCentre),
        labelCentre: Math.round(label.top + label.height / 2),
        inputHeight: Math.round(cells[i].firstElementChild!.getBoundingClientRect().height),
        checkboxHeight: Math.round(cells[i + 2].firstElementChild!.getBoundingClientRect().height),
      });
    }
    return rows;
  });
}

for (const variant of ['outlined', 'underlined', 'plain']) {
  test(`the checkbox label is on the line of the input text, ${variant}`, async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.goto('/examples/density');
    await page.getByText('stretch demo to browser').click();
    await selectVariant(page, variant);

    for (const row of await measureRows(page)) {
      expect(row.labelCentre).toBe(row.textCentre);
      expect(row.checkboxHeight).toBe(row.inputHeight);
    }
  });
}
