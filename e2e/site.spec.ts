import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, horizontalOverflow } from './axe.ts';
import { base } from './site.ts';

test('the index lists published articles, newest first', async ({ page }) => {
  await page.goto('');
  const titles = page.locator('.el-card__title');
  await expect(titles).toHaveText(['A Tour of Elucidate', 'Hello, World']);
  await expect(page.locator('.el-card__label').first()).toHaveText('Guide — Nov 2026');
  await expectNoAxeViolations(page);
});

test('tag pages filter the index', async ({ page }) => {
  await page.goto('');
  await page.getByRole('link', { name: 'writing' }).click();
  await expect(page).toHaveURL(new RegExp(`${base}research/tag/writing/$`));
  await expect(page.locator('.el-card__title')).toHaveText(['A Tour of Elucidate']);
  await expect(page.getByRole('link', { name: 'writing' })).toHaveAttribute('aria-current', 'page');
  await expectNoAxeViolations(page);
});

test('MDX pages in src/pages get the Page layout', async ({ page }) => {
  await page.goto('about/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(page.locator('.el-dek')).toHaveText('What this publication is and how it is made.');
  await expect(page).toHaveTitle('About · Elucidate');
  await expectNoAxeViolations(page);
});

test('unknown URLs show the 404 page with a link home', async ({ page }) => {
  const response = await page.goto('does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute(
    'href',
    base,
  );
  await expectNoAxeViolations(page);
});

test('internal links respect the base path', async ({ page }) => {
  for (const path of ['', 'research/hello-world/', 'about/']) {
    await page.goto(path);
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    expect(hrefs.filter((href) => !href.startsWith(base))).toEqual([]);
  }
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['', 'research/a-tour-of-elucidate/', 'about/']) {
    await page.goto(path);
    expect(await horizontalOverflow(page)).toBe(0);
  }
});

test('feeds and machine-readable files are served under the base path', async ({ request }) => {
  const site = `https://elucidatejs.github.io${base}`;
  expect(await (await request.get('rss.xml')).text()).toContain(
    `<link>${site}research/a-tour-of-elucidate/</link>`,
  );
  expect(await (await request.get('llms.txt')).text()).toContain(
    `- [Hello, World](${site}research/hello-world/): `,
  );
  expect(await (await request.get('robots.txt')).text()).toContain(
    `Sitemap: ${site}sitemap-index.xml`,
  );
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  expect(sitemap).toContain(`<loc>${site}research/hello-world/</loc>`);
  expect(sitemap).not.toContain('rss.xml');
});

test('every page links the RSS feed', async ({ page }) => {
  await page.goto('about/');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href',
    `${base}rss.xml`,
  );
});
