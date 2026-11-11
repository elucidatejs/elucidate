import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, horizontalOverflow } from './axe.ts';

const article = 'research/a-tour-of-elucidate/';

for (const width of [375, 1024, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`example article at ${width}px, ${colorScheme}: no overflow, no axe violations`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto(article);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      expect(await horizontalOverflow(page)).toBe(0);
      await expectNoAxeViolations(page);
    });
  }
}

test('title block shows eyebrow, title, hero and byline', async ({ page }) => {
  await page.goto(article);
  await expect(page.locator('.el-eyebrow')).toHaveText('Guide — Nov 11, 2026');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Tour of Elucidate');
  await expect(page.locator('.el-hero svg[role="img"]')).toBeVisible();
  const byline = page.locator('.el-byline');
  await expect(byline).toContainText('Ada Lovelace');
  await expect(byline).toContainText('University of Cambridge');
  await expect(byline.getByRole('link', { name: 'ORCID iD of Ada Lovelace' })).toHaveAttribute(
    'href',
    'https://orcid.org/0000-0002-1825-0097',
  );
  await expect(page.locator('.el-abstract')).toContainText('Elucidate turns a folder');
});

test('wide screens show a numbered floating contents list that follows the reader', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(article);
  const toc = page.locator('.el-toc--float');
  await expect(toc).toBeVisible();
  await expect(page.locator('.el-toc--disclosure')).toBeHidden();
  await expect(toc.locator('.el-toc__number').first()).toHaveText('01');
  // It starts level with the first line of the article: the abstract's label.
  const top = async (selector: string) => (await page.locator(selector).boundingBox())?.y;
  expect(await top('.el-toc--float .el-label')).toBe(await top('.el-abstract > .el-label'));
  // Next to the prose, the links still take mouse clicks (the prose box must not cover them).
  await page.evaluate(() => scrollTo(0, 1200));
  await toc.getByRole('link', { name: /Math/ }).click({ timeout: 2000 });
  await expect(page).toHaveURL(/#math$/);
  await page.evaluate(() => document.getElementById('figures')?.scrollIntoView());
  // The list fades out while a wide figure passes under it, so look for its links even then.
  const link = (name: RegExp) => toc.getByRole('link', { name, includeHidden: true });
  await expect(link(/Figures/)).toHaveAttribute('aria-current', 'true');
  await expect(link(/The hero/)).not.toHaveAttribute('aria-current');
  // Wide content passing under the contents column still takes clicks there.
  const block = page.locator('.el-prose > .el-width-page').first();
  await block.scrollIntoViewIfNeeded();
  const box = (await block.boundingBox()) as { y: number; height: number };
  const column = (await toc.boundingBox()) as { x: number };
  const hit = await page.evaluate(
    ([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('.el-width-page')),
    [column.x + 10, box.y + box.height / 2],
  );
  expect(hit).toBe(true);
});

test('phones show contents as a disclosure under the byline', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(article);
  await expect(page.locator('.el-toc--float')).toBeHidden();
  const disclosure = page.locator('.el-toc--disclosure');
  await disclosure.getByText('Contents').click();
  await disclosure.getByRole('link', { name: /Figures/ }).click();
  await expect(page).toHaveURL(/#figures$/);
  await expect(disclosure).not.toHaveAttribute('open');
});

test('the theme toggle switches and remembers the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(article);
  const toggle = page.getByRole('button', { name: 'Dark theme' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
