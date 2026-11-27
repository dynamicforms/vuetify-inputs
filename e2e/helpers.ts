import { type Locator, type Page } from '@playwright/test';

// opens the menu of a Vuetify select and clicks the option whose whole text is `option`, ignoring case
export async function chooseOption(page: Page, field: Locator, option: string) {
  await field.click();
  await page.locator('.v-overlay-container .v-list-item', { hasText: new RegExp(`^${option}$`, 'i') }).click();
}

export async function openDensityDemo(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto('/examples/density');
}

// sets the variant of every field in the density demo
export async function chooseDensityVariant(page: Page, variant: string) {
  await chooseOption(page, page.locator('.density-demo .v-field').first(), variant);
}
