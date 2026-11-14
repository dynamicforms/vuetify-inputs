// Runs axe on every page under docs/examples/, and with menus open and validation errors shown, on the library's
// components only. Violations listed in a11y-baseline.json are known; the test fails on a violation not in the
// baseline and on a baseline entry that no longer occurs. Regenerate the baseline with
// `A11Y_UPDATE_BASELINE=1 npm run test:e2e -- e2e/a11y.spec.ts`.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Baseline = Record<string, string[]>;

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, 'a11y-baseline.json');
const examplesDir = join(here, '..', 'docs', 'examples');
const updating = process.env.A11Y_UPDATE_BASELINE === '1';

const tags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
// library components: fields, action buttons and the menus they open
const include = ['.vp-doc .v-input', '.vp-doc .df-actions', '.v-overlay-container .v-overlay--active'];

const baseline: Baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {};
const found: Baseline = {};

const pages = readdirSync(examplesDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''))
  .sort();

const states = {
  selectMenu: 'df-select: menu open',
  datetimePicker: 'df-datetime: picker open',
  colorPicker: 'df-color: picker open',
  colorPalette: 'df-color: hexagon palette open',
  validatorErrors: 'validators: errors shown',
  actionsSimple: 'df-actions: simple',
};
// every baseline key the suite produces
const keys = new Set<string>([...pages, ...Object.values(states)]);

async function open(page: Page, slug: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/examples/${slug === 'index' ? '' : slug}`);
  await page.waitForLoadState('networkidle');
  await settle(page);
}

// waits for loading indicators to go and for finite animations and transitions to end
async function settle(page: Page) {
  await expect(page.locator('.v-progress-linear--active')).toHaveCount(0, { timeout: 10000 });
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.effect?.getComputedTiming().iterations === Infinity),
  );
}

// one `<rule id>: <element>` entry per violating node; the element is named by its component, label and tag, not by
// generated ids or its position in the page
async function scan(page: Page): Promise<string[]> {
  await settle(page);
  const present = [];
  for (const selector of include) if (await page.locator(selector).count()) present.push(selector);
  if (!present.length) return [];
  let builder = new AxeBuilder({ page }).withTags(tags);
  for (const selector of present) builder = builder.include(selector);
  const { violations } = await builder.analyze();
  const entries: string[] = [];
  for (const violation of violations) {
    for (const node of violation.nodes) {
      const selector = node.target[node.target.length - 1] as string;
      const description = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return sel;
        const own = (e: Element) => {
          const cls = [...e.classList].find((c) => !/\d/.test(c) && !c.includes('--'));
          const role = e.getAttribute('role');
          return `${e.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${role ? `[role=${role}]` : ''}`;
        };
        const root = el.closest('.v-overlay__content, .v-input, .df-actions');
        if (!root) return own(el);
        let where: string;
        if (root.classList.contains('v-overlay__content')) {
          where = `menu ${own(root.firstElementChild ?? root)}`;
        } else {
          const classes = [...root.classList].filter((c) => !c.includes('--'));
          const kind =
            classes.find((c) => /^df-/.test(c) && !/^df-(density|variant)/.test(c)) ??
            classes.find((c) => /^v-/.test(c) && c !== 'v-input' && !/^v-locale/.test(c));
          const label = root.querySelector('.v-label')?.textContent?.trim().replace(/\s+/g, ' ');
          where = `${kind ?? own(root)}${label ? ` "${label}"` : ''}`;
        }
        return el === root ? where : `${where} > ${own(el)}`;
      }, selector);
      entries.push(`${violation.id}: ${description}`);
    }
  }
  return entries.sort();
}

function check(key: string, entries: string[]) {
  found[key] = entries;
  if (updating) return;
  const known = [...(baseline[key] ?? [])];
  const unexpected: string[] = [];
  for (const entry of entries) {
    const at = known.indexOf(entry);
    if (at >= 0) known.splice(at, 1);
    else unexpected.push(entry);
  }
  expect.soft(unexpected, `${key}: violations not in e2e/a11y-baseline.json`).toEqual([]);
  expect
    .soft(known, `${key}: baseline entries that no longer occur; remove them from e2e/a11y-baseline.json`)
    .toEqual([]);
}

test.afterAll(() => {
  if (!updating) return;
  // a run filtered to some tests replaces only their entries; keys the suite no longer produces are dropped
  const merged: Baseline = { ...found };
  for (const key of Object.keys(baseline)) if (keys.has(key) && !(key in found)) merged[key] = baseline[key];
  const sorted: Baseline = {};
  for (const key of Object.keys(merged).sort()) if (merged[key].length) sorted[key] = merged[key];
  writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
});

test('baseline has no keys the suite does not produce', () => {
  test.skip(updating, 'the update run drops them');
  expect(Object.keys(baseline).filter((key) => !keys.has(key))).toEqual([]);
});

for (const slug of pages) {
  test(slug, async ({ page }) => {
    await open(page, slug);
    check(slug, await scan(page));
  });
}

test('df-select with the menu open', async ({ page }) => {
  await open(page, 'df-select');
  await page.locator('.demo-container').first().locator('.v-input').first().locator('.v-field').click();
  await expect(page.locator('.v-overlay-container .v-overlay--active .v-list-item').first()).toBeVisible();
  check(states.selectMenu, await scan(page));
});

test('df-datetime with the picker open', async ({ page }) => {
  await open(page, 'df-datetime');
  await page.locator('.v-card', { hasText: 'Date Only Example' }).first().locator('input').click();
  await expect(page.locator('.v-overlay-container .v-overlay--active')).toBeVisible();
  check(states.datetimePicker, await scan(page));
});

test('df-color with the picker open', async ({ page }) => {
  await open(page, 'df-color');
  await page.locator('.vp-doc .v-input').first().locator('input').click();
  await expect(page.locator('.v-overlay-container .v-overlay--active .v-color-picker')).toBeVisible();
  check(states.colorPicker, await scan(page));
});

test('df-color with the hexagon palette open', async ({ page }) => {
  await open(page, 'df-color');
  await page.locator('.v-card', { hasText: 'Hexagon Palette Example' }).first().locator('input').first().click();
  await expect(page.locator('.v-overlay-container .v-overlay--active .df-hexagon-palette')).toBeVisible();
  check(states.colorPalette, await scan(page));
});

test('df-actions in simple mode', async ({ page }) => {
  await open(page, 'df-actions');
  await page.locator('.actions-demo .v-checkbox', { hasText: 'Simple' }).locator('input').check();
  await expect(page.locator('.actions-demo .df-action-simple').first()).toBeVisible();
  check(states.actionsSimple, await scan(page));
});

test('validators with errors shown', async ({ page }) => {
  await open(page, 'validators');
  const field = (label: string) =>
    page.locator('.validators-form-demo .v-input', { has: page.locator('.v-label', { hasText: label }) }).first();
  for (const [label, value] of [
    ['Username', '   '],
    ['Email', 'not an address'],
    ['Age', '5'],
    ['Bio', 'short'],
  ]) {
    await field(label).locator('input, textarea:not([readonly])').first().fill(value);
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('.validators-form-demo .v-input--error')).toHaveCount(4);
  check(states.validatorErrors, await scan(page));
});
