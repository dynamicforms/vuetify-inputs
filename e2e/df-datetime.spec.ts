import { expect, type Locator, type Page, test } from '@playwright/test';

const card = (page: Page, title: string) => page.locator('.v-card', { hasText: title }).first();
const fieldValue = (page: Page, title: string) => card(page, title).locator('pre');
const picker = (page: Page) => page.locator('.v-overlay-container .v-overlay--active');

const selection = (input: Locator) =>
  input.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd, el.value.length]);

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-datetime');
});

test('a click selects the text and opens the picker; typing replaces the text and closes the picker', async ({
  page,
}) => {
  const input = card(page, 'Date Only Example').locator('input');
  await input.click();
  await expect(picker(page)).toBeVisible();
  const [start, end, length] = await selection(input);
  expect([start, end]).toEqual([0, length]);

  await page.keyboard.type('4');
  await expect(input).toHaveValue('4');
  await expect(picker(page)).toBeHidden();
});

test('the arrow keys move the day in the picker and Enter writes it', async ({ page }) => {
  const input = card(page, 'Date Only Example').locator('input');
  await input.click();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowDown');
  await expect(fieldValue(page, 'Date Only Example')).toHaveText('2026-03-15');

  await page.keyboard.press('Enter');
  await expect(fieldValue(page, 'Date Only Example')).toHaveText('2026-03-21');
  await expect(picker(page)).toBeHidden();
  await expect(input).toBeFocused();
});

test('right from the last column goes to the first column of the same row of the next month', async ({ page }) => {
  await card(page, 'Date Only Example').locator('input').click();
  await page.keyboard.press('ArrowRight');
  await expect(picker(page).locator('[data-v-date="2026-04-13"]')).toHaveClass(/v-date-picker-month__day--selected/);
  await page.keyboard.press('Enter');
  await expect(fieldValue(page, 'Date Only Example')).toHaveText('2026-04-13');
});

test('a click on a day keeps the focus in the field', async ({ page }) => {
  const input = card(page, 'Date Only Example').locator('input');
  await input.click();
  await picker(page)
    .locator('.v-date-picker-month__day:not(.v-date-picker-month__day--adjacent) button', {
      hasText: /^20$/,
    })
    .click();
  await expect(input).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(fieldValue(page, 'Date Only Example')).toHaveText('2026-03-21');
});

test('Escape closes the picker and leaves the value', async ({ page }) => {
  const input = card(page, 'Date Only Example').locator('input');
  await input.click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(picker(page)).toBeHidden();
  await expect(fieldValue(page, 'Date Only Example')).toHaveText('2026-03-15');
});

test('leaving the date for the time closes the date picker', async ({ page }) => {
  const inputs = card(page, 'DateTime Example').locator('input');
  await inputs.nth(0).click();
  await expect(picker(page).locator('.v-date-picker')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(inputs.nth(1)).toBeFocused();
  await expect(picker(page)).toBeHidden();
});

test('left and right move the hour, up and down the minute', async ({ page }) => {
  await card(page, 'Time Only Example').locator('input').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(fieldValue(page, 'Time Only Example')).toHaveText('10:31:00');
});

test('up and down open a closed picker and keep the focus in the field', async ({ page }) => {
  const input = card(page, 'Date Only Example').locator('input');
  await input.click();
  await page.keyboard.press('Escape');
  await expect(picker(page)).toBeHidden();

  await page.keyboard.press('ArrowDown');
  await expect(picker(page)).toBeVisible();
  await expect(input).toBeFocused();
});
