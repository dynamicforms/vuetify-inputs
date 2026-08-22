import { expect, Page, test } from '@playwright/test';

// A tiny valid PNG (10x10 red square) - real pixel data isn't the point, just something the <img> can decode so
// TipTap's resize NodeView actually shows the node view (it stays hidden until the image's load/error event fires).
const RED_SQUARE =
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGM4YWSEBzGMSmNDADQHdTFYnw0tAAAAAElFTkSuQmCC';

const TABLE_WITH_TWO_IMAGES = `<table style="min-width: 50px;"><colgroup><col style="min-width: 25px;"><col
  style="min-width: 25px;"></colgroup><tbody><tr>
  <td><p><img src="data:image/png;base64,${RED_SQUARE}" alt="small" width="118" height="79"></p></td>
  <td><p><img src="data:image/png;base64,${RED_SQUARE}" alt="large" width="368" height="389"></p></td>
</tr></tbody></table>`;

// Word's clipboard HTML for a shaded table cell: mso-* noise plus a literal (non-mso) `background`/`bgcolor` -
// the kind of "Automatic" theme colour Word resolves to black in the exported HTML even though the cell looked
// white on screen.
const WORD_TABLE_WITH_BLACK_SHADING = `<html xmlns:o="urn:schemas-microsoft-com:office:office">
<body lang=EN-US style='tab-interval:36.0pt'>
<table class=MsoTableGrid border=1 style='border-collapse:collapse;mso-border-alt:solid windowtext .5pt'>
<tr><td style='border:solid windowtext 1.0pt;background:black;mso-background-themecolor:text1' bgcolor=black>
<p class=MsoNormal><span lang=EN-US>Hello <b>World</b><o:p></o:p></span></p>
</td></tr></table>
</body></html>`;

async function pasteHtml(page: Page, html: string) {
  await page.click('.rtf-content');
  await page.evaluate((htmlContent) => {
    const el = document.querySelector('.rtf-content');
    if (!el) throw new Error('.rtf-content not found');
    (el as HTMLElement).focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/html', htmlContent);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true }));
  }, html);
  await page.waitForTimeout(300);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/df-rtf-editor');
  await page.waitForSelector('.rtf-content');
});

test('pasting a Word table strips background shading instead of carrying it into the theme', async ({ page }) => {
  await pasteHtml(page, WORD_TABLE_WITH_BLACK_SHADING);

  const td = page.locator('.rtf-content td').first();
  await expect(td).toHaveText(/Hello\s*World/);
  await expect(td).not.toHaveAttribute('style', /background/);
  await expect(td).not.toHaveAttribute('bgcolor', /.+/);
  await expect(td).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('an image shows visible resize handles on hover, sized and coloured', async ({ page }) => {
  await pasteHtml(page, TABLE_WITH_TWO_IMAGES);

  const image = page.locator('.rtf-content img[src^="data:"]').last();
  await image.scrollIntoViewIfNeeded();
  await image.hover();

  const container = page.locator('.rtf-content [data-resize-container]').last();
  const handle = container.locator('[data-resize-handle="bottom-right"]');
  await expect(handle).toHaveCSS('opacity', '1');
  const box = await handle.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
});

test('the selection bubble menu stays hidden for an image but still works for text', async ({ page }) => {
  await pasteHtml(page, TABLE_WITH_TWO_IMAGES);

  const image = page.locator('.rtf-content img[src^="data:"]').last();
  await image.scrollIntoViewIfNeeded();
  await image.click({ force: true });
  await expect(page.locator('.rtf-bubble-menu')).toHaveCount(0);

  const paragraph = page.locator('.rtf-content p').first();
  await paragraph.click();
  await page.keyboard.press('Home');
  await page.keyboard.down('Shift');
  await page.keyboard.press('End');
  await page.keyboard.up('Shift');
  await expect(page.locator('.rtf-bubble-menu')).toBeVisible();
});
