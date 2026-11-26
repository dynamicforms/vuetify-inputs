import { expect, type Locator, type Page, test } from '@playwright/test';

function priceInput(page: Page): Locator {
  return page.locator('.v-number-input', { hasText: 'Price' }).locator('input');
}

async function setPrice(page: Page, text: string) {
  const price = priceInput(page);
  await price.fill(text);
  await price.press('Tab');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-input');
  await setPrice(page, '12');
  await expect(priceInput(page)).toHaveValue('12.00');
});

test('typing over a selected value with trailing zeros replaces it', async ({ page }) => {
  const price = priceInput(page);

  await price.fill('7');

  await expect(price).toHaveValue('7');
});

test('a field entered with the keyboard replaces its value with the typed text', async ({ page }) => {
  const price = priceInput(page);
  await page.locator('.v-number-input', { hasText: 'Quantity' }).locator('input').click();
  for (let i = 0; i < 5 && !(await price.evaluate((input) => input === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(price).toBeFocused();

  await page.keyboard.type('7');

  await expect(price).toHaveValue('7');
});

test('typing after a click appends to the value', async ({ page }) => {
  const price = priceInput(page);

  await price.click();
  await price.press('End');
  await page.keyboard.type('5');

  await expect(price).toHaveValue('125');
});

test('typing over a selected value replaces it when leaving another field re-renders the form', async ({ page }) => {
  const price = priceInput(page);
  await page.locator('.v-number-input', { hasText: 'Quantity' }).locator('input').fill('3');

  await price.fill('7');

  await expect(price).toHaveValue('7');
});

test.describe('with anyDecimalSeparator', () => {
  function amountInput(page: Page): Locator {
    return page.locator('.v-number-input', { hasText: 'Amount' }).locator('input');
  }

  test('a typed comma is the decimal separator and a second separator is ignored', async ({ page }) => {
    const amount = amountInput(page);

    await amount.click();
    await page.keyboard.type('3,2.5');

    await expect(amount).toHaveValue('3.25');
    await expect(page.locator('.value-item', { hasText: 'Amount:' })).toContainText('3.25');
  });

  test('pasted text keeps its last separator as the decimal separator', async ({ page }) => {
    const amount = amountInput(page);
    await amount.click();

    await amount.evaluate((input) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '1.234,56');
      input.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    });

    await expect(amount).toHaveValue('1234.56');
    await expect(page.locator('.value-item', { hasText: 'Amount:' })).toContainText('1234.56');
  });
});
