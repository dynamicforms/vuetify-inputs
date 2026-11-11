import { expect, type Page, test } from "@playwright/test";

async function choose(page: Page, index: number, option: string) {
  await page.locator(".input-group-demo .v-field").nth(index).click();
  await page
    .locator(".v-overlay-container .v-list-item", {
      hasText: new RegExp(`^${option}$`),
    })
    .click();
}

// the outer field of each column of the demo row, and the vertical centre of the text in the first column and of the
// first checkbox label in the group
function measure(page: Page) {
  return page.locator(".input-group-demo .demo-row").evaluate((row) => {
    const fields = [...row.querySelectorAll(":scope > div")].map((col) => {
      const box = col.querySelector(".v-field")!.getBoundingClientRect();
      return { top: Math.round(box.top), bottom: Math.round(box.bottom) };
    });
    const centre = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const box = range.getBoundingClientRect();
      return Math.round(box.top + box.height / 2);
    };
    const input = row.querySelector("input")!;
    const inputBox = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    const textCentre = Math.round(
      (inputBox.top +
        parseFloat(style.paddingTop) +
        inputBox.bottom -
        parseFloat(style.paddingBottom)) /
        2,
    );
    return {
      fields,
      textCentre,
      labelCentre: centre(
        row.querySelector(".df-input-group .v-checkbox label")!,
      ),
    };
  });
}

for (const variant of ["outlined", "underlined", "solo", "inverted"]) {
  for (const density of ["default", "comfortable", "compact"]) {
    test(`a one-row group is level with the fields beside it, ${variant} ${density}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1400, height: 1000 });
      await page.goto("/examples/df-input-group");
      await choose(page, 0, variant);
      await choose(page, 1, density);
      await choose(page, 2, "row");
      await expect(
        page.locator(".demo-row .df-input-group-content"),
      ).toHaveClass(/df-input-group--row/);

      const { fields, textCentre, labelCentre } = await measure(page);
      expect(new Set(fields.map((field) => field.top)).size).toBe(1);
      expect(new Set(fields.map((field) => field.bottom)).size).toBe(1);
      expect(Math.abs(labelCentre - textCentre)).toBeLessThanOrEqual(1);
    });
  }
}
