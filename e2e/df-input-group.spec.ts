import { expect, type Page, test } from './test';

import { chooseOption } from "./helpers";

function choose(page: Page, index: number, option: string) {
  return chooseOption(page, page.locator(".input-group-demo .v-field").nth(index), option);
}

// the outer field of each column of the demo row, and the vertical centre of the text in the first column and of the
// first checkbox label in the group
function measure(page: Page) {
  return page.locator(".input-group-demo .demo-row").evaluate((row) => {
    const fields = [...row.querySelectorAll(":scope > div")].map((col) => {
      const box = col.querySelector(".v-field")!.getBoundingClientRect();
      return { top: Math.round(box.top), bottom: Math.round(box.bottom) };
    });
    const center = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const box = range.getBoundingClientRect();
      return Math.round(box.top + box.height / 2);
    };
    const input = row.querySelector("input")!;
    const inputBox = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    const textCenter = Math.round(
      (inputBox.top +
        parseFloat(style.paddingTop) +
        inputBox.bottom -
        parseFloat(style.paddingBottom)) /
        2,
    );
    return {
      fields,
      textCenter,
      labelCenter: center(
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

      const { fields, textCenter, labelCenter } = await measure(page);
      expect(new Set(fields.map((field) => field.top)).size).toBe(1);
      expect(new Set(fields.map((field) => field.bottom)).size).toBe(1);
      expect(Math.abs(labelCenter - textCenter)).toBeLessThanOrEqual(1);
    });
  }
}
