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
  await page.locator('#images').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('images')?.scrollIntoView());
  await expect(toc.getByRole('link', { name: /Images/ })).toHaveAttribute('aria-current', 'true');
  await expect(toc.getByRole('link', { name: /The hero/ })).not.toHaveAttribute('aria-current');
});

test('phones show contents as a disclosure under the byline', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(article);
  await expect(page.locator('.el-toc--float')).toBeHidden();
  const disclosure = page.locator('.el-toc--disclosure');
  await disclosure.getByText('Contents').click();
  await disclosure.getByRole('link', { name: /Images/ }).click();
  await expect(page).toHaveURL(/#images$/);
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
