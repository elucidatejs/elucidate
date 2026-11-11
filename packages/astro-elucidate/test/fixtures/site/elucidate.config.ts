import { defineConfig } from 'astro-elucidate/config';

// A site like the starter, customized the ways docs/customizing.md describes: a homepage of its
// own under a project path, a structural component override, a registered component of its own,
// and a bespoke article.
export default defineConfig({
  title: 'Fixture',
  url: 'https://example.org/journal',
  description: 'A site for the integration tests.',
  home: 'page',
  nav: [
    { label: 'Research', href: '/research/' },
    { label: 'Home', href: '/' },
  ],
  showcase: 'public',
  overrides: { Byline: './src/overrides/Byline.astro' },
});
