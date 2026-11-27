import { expect, type Locator, type Page, test } from '@playwright/test';

import { pasteData } from './helpers';

function numberInput(page: Page, label: string): Locator {
  return page.locator('.v-number-input', { hasText: label }).locator('input');
}

async function setPrice(page: Page, text: string) {
  const price = numberInput(page, 'Price');
  await price.fill(text);
  await price.press('Tab');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-input');
  await setPrice(page, '12');
  await expect(numberInput(page, 'Price')).toHaveValue('12.00');
});

test('typing over a selected value with trailing zeros replaces it', async ({ page }) => {
  const price = numberInput(page, 'Price');

  await price.fill('7');

  await expect(price).toHaveValue('7');
});

test('a field entered with the keyboard replaces its value with the typed text', async ({ page }) => {
  const price = numberInput(page, 'Price');
  await numberInput(page, 'Quantity').click();
  for (let i = 0; i < 5 && !(await price.evaluate((input) => input === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(price).toBeFocused();

  await page.keyboard.type('7');

  await expect(price).toHaveValue('7');
});

test('typing after a click appends to the value', async ({ page }) => {
  const price = numberInput(page, 'Price');

  await price.click();
  await price.press('End');
  await page.keyboard.type('5');

  await expect(price).toHaveValue('125');
});

test('typing over a selected value replaces it when leaving another field re-renders the form', async ({ page }) => {
  const price = numberInput(page, 'Price');
  await numberInput(page, 'Quantity').fill('3');

  await price.fill('7');

  await expect(price).toHaveValue('7');
});

test.describe('with anyDecimalSeparator', () => {
  test('a typed comma is the decimal separator and a second separator is ignored', async ({ page }) => {
    const amount = numberInput(page, 'Amount');

    await amount.click();
    await page.keyboard.type('3,2.5');

    await expect(amount).toHaveValue('3.25');
    await expect(page.locator('.value-item', { hasText: 'Amount:' })).toContainText('3.25');
  });

  test('pasted text keeps its last separator as the decimal separator', async ({ page }) => {
    const amount = numberInput(page, 'Amount');
    await amount.click();

    await pasteData(amount, 'text/plain', '1.234,56');

    await expect(amount).toHaveValue('1234.56');
    await expect(page.locator('.value-item', { hasText: 'Amount:' })).toContainText('1234.56');
  });
});
