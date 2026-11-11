import { defineConfig } from 'astro-elucidate/config';

// A site like the starter, customized the ways docs/customizing.md describes: a structural
// component override, a registered component of its own, and a bespoke article.
export default defineConfig({
  title: 'Fixture',
  url: 'https://example.org',
  showcase: 'public',
  overrides: { Byline: './src/overrides/Byline.astro' },
});
