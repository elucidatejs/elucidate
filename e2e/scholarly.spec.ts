import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe.ts';

const article = 'research/a-tour-of-elucidate/';
const card = '#el-hovercard';

test('equations, figures and tables are numbered and cross-references link to them', async ({
  page,
}) => {
  await page.goto(article);
  const prose = page.locator('.el-prose');
  await expect(prose.locator('.el-equation[id="eq:momentum"] .katex-tag')).toHaveText('(2)');
  await expect(page.locator('[id="fig:widths"] .el-figure__label')).toHaveText('Figure 1');
  await expect(page.locator('[id="tbl:widths"] .el-figure__label')).toHaveText('Table 1');
  await expect(page.locator('h2#math')).toBeVisible();

  const links = prose.locator('a.el-xref');
  for (const [name, target] of [
    ['Equation 2', 'eq:momentum'],
    ['Figure 1', 'fig:widths'],
    ['Table 1', 'tbl:widths'],
    ['Math', 'math'],
    ['A. Derivations', 'sec:derivations'],
  ]) {
    await expect(links.filter({ hasText: name }).first()).toHaveAttribute('href', `#${target}`);
    await expect(page.locator(`[id="${target}"]`)).toHaveCount(1);
  }
});

test('citations are numbered in order of first use and link to the references', async ({
  page,
}) => {
  await page.goto(article);
  const numbers = await page.locator('.el-prose .el-cite__ref').allTextContents();
  expect(numbers).toEqual(['1', '2', '3', '4']);
  const references = page.locator('.el-references > li');
  await expect(references).toHaveCount(4);
  await expect(references.first()).toHaveAttribute('id', 'ref-goh2017');
  await expect(references.first()).toContainText('Why Momentum Really Works');
});

test('a citation card opens on hover and closes when the pointer leaves', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(article);
  await page.locator('.el-prose .el-cite__ref').first().hover();
  await expect(page.locator(card)).toBeVisible();
  await expect(page.locator(card)).toContainText('Why Momentum Really Works');
  await page.mouse.move(5, 5);
  await expect(page.locator(card)).toBeHidden();
});

test('a citation card opens on keyboard focus and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(article);
  const link = page.locator('.el-prose .el-cite__ref').nth(1);
  await link.focus();
  await expect(page.locator(card)).toBeVisible();
  await expect(link).toHaveAttribute('aria-describedby', 'el-hovercard');
  await expect(page.locator(card)).toContainText('Polyak');
  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(page.locator(card)).toBeHidden();
  await expect(link).not.toHaveAttribute('aria-describedby');
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 800 } });

  test('the first tap on a footnote shows the note, a second tap follows the link', async ({
    page,
  }) => {
    await page.goto(article);
    const link = page.locator('.el-prose a[data-footnote-ref]').first();
    await link.tap();
    await expect(page.locator(card)).toBeVisible();
    await expect(page.locator(card)).toContainText('Copy it to start');
    expect(new URL(page.url()).hash).toBe('');
    await link.tap();
    await expect(page).toHaveURL(/#fn-1$/);
    await expect(page.locator(card)).toBeHidden();
  });
});

test('footnotes sit beside the text on wide screens and stay out of the way on phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(article);
  const sidenote = page.locator('.el-sidenote').first();
  await expect(sidenote).toBeVisible();
  await expect(sidenote).toContainText('Copy it to start');
  // The note is not shown twice: hovering its number opens no card.
  await page.locator('.el-prose a[data-footnote-ref]').first().hover();
  await expect(page.locator(card)).toBeHidden();

  await page.setViewportSize({ width: 375, height: 800 });
  await expect(sidenote).toBeHidden();
});

test('the appendix lists its sections in order and ends with the citation box', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(article);
  await expect(page.locator('.el-appendix__heading')).toHaveText([
    'Acknowledgments',
    'Author contributions',
    'A. Derivations',
    'Discussion and review',
    'Footnotes',
    'References',
    'Updates and corrections',
    'Reuse',
    'Citation',
  ]);
  await expect(page.locator('#fn-2')).toContainText('Like this one.');
  await expect(page.locator('#fn-2 .katex')).toHaveCount(1);
  await expect(page.locator('#el-citation-text')).toContainText(
    'Lovelace & Babbage, "A Tour of Elucidate"',
  );
  await page.getByRole('button', { name: 'Copy BibTeX' }).click();
  await expect(page.getByRole('button', { name: 'Copy BibTeX' })).toHaveText('Copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/^@article\{lovelace2026tour,/);
});

test('article pages carry scholarly and social meta tags', async ({ page }) => {
  await page.goto(article);
  const meta = (name: string) => page.locator(`meta[name="${name}"], meta[property="${name}"]`);
  await expect(meta('citation_title')).toHaveAttribute('content', 'A Tour of Elucidate');
  await expect(meta('citation_author')).toHaveCount(2);
  await expect(meta('citation_author_orcid')).toHaveAttribute('content', '0000-0002-1825-0097');
  await expect(meta('citation_publication_date')).toHaveAttribute('content', '2026/11/11');
  await expect(meta('citation_reference')).toHaveCount(4);
  await expect(meta('og:type')).toHaveAttribute('content', 'article');
  // This hero is a component, not an image, so the page has no social image (spec §14).
  await expect(meta('og:image')).toHaveCount(0);
});

test('math styles load only on pages with math', async ({ page }) => {
  const katexCss = 'link[rel="stylesheet"][href*="katex"]';
  await page.goto(article);
  await expect(page.locator(katexCss)).toHaveCount(1);
  for (const path of ['research/hello-world/', 'about/']) {
    await page.goto(path);
    await expect(page.locator(katexCss)).toHaveCount(0);
    await expect(page.locator('.katex')).toHaveCount(0);
  }
});
