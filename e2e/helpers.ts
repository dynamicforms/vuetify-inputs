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

// clicks `selector` and returns the native file chooser it opens
export async function openFileChooser(page: Page, selector: string) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click(selector)]);
  return chooser;
}

// dispatches a drop of one file on `target`; the content is `base64` decoded, or `text`
export async function dropFile(
  page: Page,
  target: Locator,
  file: { name: string; type: string; base64?: string; text?: string },
) {
  const dataTransfer = await page.evaluateHandle(({ name, type, base64, text }) => {
    const content = base64 === undefined ? (text ?? '') : Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([content], name, { type }));
    return dt;
  }, file);
  await target.dispatchEvent('drop', { dataTransfer });
}

// focuses `target` and dispatches a paste whose clipboard holds `data` as `type`
export async function pasteData(target: Locator, type: string, data: string) {
  await target.evaluate(
    (el, { type, data }) => {
      (el as HTMLElement).focus();
      const clipboardData = new DataTransfer();
      clipboardData.setData(type, data);
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    },
    { type, data },
  );
}
