import { expect, test } from "@playwright/test";

test("every field of the inverted variant has the surface-variant background, focused or not", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.goto("/examples/density");
  await page.locator(".density-demo .v-field").first().click();
  await page
    .locator(".v-overlay-container .v-list-item", { hasText: /^inverted$/i })
    .click();

  // the outer field of each cell; df-checkbox has none
  const fields = page.locator(
    ".demo-grid .component-cell > * > .v-input__control > .v-field, " +
      ".demo-grid .component-cell > * > .v-input > .v-input__control > .v-field",
  );
  await expect(fields).toHaveCount(4 * 6);
  for (const field of await fields.all()) {
    await expect(field).toHaveClass(/v-field--variant-solo\b/);
    await expect(field).toHaveClass(/\bbg-surface-variant\b/);
  }
});
