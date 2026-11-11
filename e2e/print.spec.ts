import { expect, test } from '@playwright/test';

const article = 'research/a-tour-of-elucidate/';

test('print: one light column, no contents or controls, fallbacks and reference addresses', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  await page.goto(article);

  for (const selector of ['.el-header', '.el-toc--float', '.el-sidenote', '.el-copy']) {
    await expect(page.locator(selector).first(), selector).toBeHidden();
  }
  // Light colors whatever the screen theme.
  const background = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  expect(background).toBe('rgb(255, 255, 255)');

  // Wide figures and the text share one column.
  const width = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(await width('[id="fig:widths"]')).toBe(await width('.el-prose > p'));

  // The interactive figure prints its fallback image instead of its controls.
  await expect(page.locator('[id="fig:momentum"] .el-figure__fallback img')).toBeVisible();
  await expect(page.locator('[id="fig:momentum"] .el-figure__content')).toBeHidden();

  // A reference whose link is not its DOI prints the address after the title.
  const after = await page
    .locator('#ref-sutskever2013 .el-ref__title')
    .evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).toContain('https://');
});
