import { expect, type Locator, type Page, test } from '@playwright/test';

// the demo's fake server answers each fetch after 3000 ms
const FETCH = { timeout: 10000 };

const demo = (page: Page) => page.locator('.demo-container', { has: page.getByText('Dynamic options loading') });

const languageSelect = (page: Page) =>
  demo(page)
    .locator('.v-input.v-autocomplete')
    .filter({ has: page.getByText('Programming languages', { exact: true }) })
    .first();

const selectedValue = (page: Page) => demo(page).locator('div', { has: page.getByText('Selected value:') }).last();
// the demo shows a null value as nothing after the label
const NO_VALUE = /^\s*Selected value:\s*$/;

const menu = (page: Page) => page.locator('.v-overlay-container');

// every language option carries its typing discipline on the second line
const languageOptions = (page: Page) => menu(page).getByRole('option', { name: /typed/ });

async function openDemo(page: Page): Promise<Locator> {
  await page.goto('/examples/df-select');
  // until it renders in the browser, the select is a read-only text field
  await expect(
    demo(page).locator('.v-input').filter({ has: page.getByText('Programming languages', { exact: true }) }).first(),
  ).toHaveClass(/v-autocomplete/);
  await expect(selectedValue(page)).toHaveText(NO_VALUE);
  return languageSelect(page);
}

async function isFocused(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
}

async function chooseWithKeyboard(page: Page, query: string, option: RegExp) {
  await page.keyboard.type(query);
  const target = menu(page).getByRole('option', { name: option });
  await expect(target).toBeVisible(FETCH);
  for (let i = 0; i < 12 && !(await isFocused(target)); i += 1) {
    await page.keyboard.press('ArrowDown');
  }
  expect(await isFocused(target)).toBe(true);
  await page.keyboard.press('Enter');
}

async function choosePython(page: Page, select: Locator) {
  await select.locator('input').focus();
  await chooseWithKeyboard(page, 'Py', /Python\W+Dynamically typed/);
  await expect(selectedValue(page)).toHaveText(/Selected value:\s*py\s*$/);
}

test('an option and the chip show the language name with its typing discipline on a second line', async ({ page }) => {
  const select = await openDemo(page);

  await select.locator('.v-field').click();
  await page.keyboard.type('Py');
  const python = menu(page).getByRole('option', { name: /Python\W+Dynamically typed/ });
  await expect(python).toBeVisible(FETCH);
  const lines = async (locator: Locator) =>
    (await locator.innerText())
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  expect(await lines(python.locator('.v-list-item-title'))).toEqual(['Python', 'Dynamically typed']);

  await python.click();

  await expect(selectedValue(page)).toHaveText(/Selected value:\s*py\s*$/);
  const chip = select.locator('.v-chip');
  await expect(chip.locator('br')).toHaveCount(1);
  expect(await lines(chip)).toEqual(['Python', 'Dynamically typed']);
});

test('a chosen value is replaced with the keyboard only, without the old name ending up in the typed text', async ({
  page,
}) => {
  const select = await openDemo(page);
  const input = select.locator('input');
  await choosePython(page, select);
  await expect(select.locator('.v-chip')).toContainText('Python');

  await page.keyboard.press('Tab');
  await expect(input).not.toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(input).toBeFocused();

  await input.evaluate((el) => {
    const seen: string[] = [];
    (window as unknown as { seenInputValues: string[] }).seenInputValues = seen;
    el.addEventListener('input', () => seen.push((el as HTMLInputElement).value));
  });
  await chooseWithKeyboard(page, 'Ja', /\bJava\W+Statically typed/);

  await expect(selectedValue(page)).toHaveText(/Selected value:\s*java\s*$/);
  await expect(select.locator('.v-chip')).toContainText('Java');
  await expect(select.locator('.v-chip')).not.toContainText('Python');
  const seen = await page.evaluate(() => (window as unknown as { seenInputValues: string[] }).seenInputValues);
  expect(seen).not.toContain('PythonJa');
  expect(seen.some((value) => value.includes('Python'))).toBe(false);
  await expect(input).not.toHaveValue('PythonJa');
});

test('Backspace on the empty input clears the value, and so does the clear button', async ({ page }) => {
  const select = await openDemo(page);
  const input = select.locator('input');

  await choosePython(page, select);
  await page.keyboard.press('Escape');
  await input.focus();
  await expect(input).toHaveValue('');
  await page.keyboard.press('Backspace');
  await expect(selectedValue(page)).toHaveText(NO_VALUE);
  await expect(select.locator('.v-chip')).toHaveCount(0);

  await choosePython(page, select);
  await page.keyboard.press('Escape');
  await select.locator('.v-field__clearable .v-icon').click();
  await expect(selectedValue(page)).toHaveText(NO_VALUE);
  await expect(select.locator('.v-chip')).toHaveCount(0);
});

test('with "Minimum query of two letters" one letter asks for more and two letters fetch matching languages', async ({
  page,
}) => {
  const select = await openDemo(page);
  const minimum = demo(page).getByRole('checkbox', { name: 'Minimum query of two letters' });
  await expect(minimum).not.toBeChecked();
  await minimum.check();

  await select.locator('input').focus();
  await page.keyboard.type('J');
  await expect(menu(page).getByText('Type at least two letters of the language name.')).toBeVisible(FETCH);
  await expect(languageOptions(page)).toHaveCount(0);

  await page.keyboard.type('a');
  await expect(menu(page).getByRole('option', { name: /\bJava\W+Statically typed/ })).toBeVisible(FETCH);
  await expect(menu(page).getByRole('option', { name: /JavaScript\W+Dynamically typed/ })).toBeVisible();
  await expect(menu(page).getByRole('option', { name: /Python/ })).toHaveCount(0);
  await expect(menu(page).getByText('Type at least two letters of the language name.')).toHaveCount(0);
});

test('a query that matches no language shows "No languages found." after the fetch', async ({ page }) => {
  const select = await openDemo(page);

  await select.locator('input').focus();
  await page.keyboard.type('xyz');

  await expect(menu(page).getByText('No languages found.')).toBeVisible(FETCH);
  await expect(languageOptions(page)).toHaveCount(0);
});
