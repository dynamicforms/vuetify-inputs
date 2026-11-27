import { expect, test } from './test';

import { chooseDensityVariant, openDensityDemo } from "./helpers";

test("every field of the inverted variant has the surface-variant background, focused or not", async ({
  page,
}) => {
  await openDensityDemo(page, { width: 1800, height: 1000 });
  await chooseDensityVariant(page, "inverted");

  // the outer field of each cell; df-checkbox has none
  const fields = page.locator(
    ".demo-grid .component-cell > * > .v-input__control > .v-field, " +
      ".demo-grid .component-cell > * > .v-input > .v-input__control > .v-field",
  );
  await expect(fields).toHaveCount(4 * 7);
  for (const field of await fields.all()) {
    await expect(field).toHaveClass(/v-field--variant-solo\b/);
    await expect(field).toHaveClass(/\bbg-surface-variant\b/);
  }
});
