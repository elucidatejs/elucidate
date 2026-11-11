import { defineConfig } from 'astro-elucidate/config';

export default defineConfig({
  title: 'Elucidate',
  url: 'https://elucidatejs.github.io/elucidate',
  description: 'Web-native scientific articles, in the spirit of Distill.',
  nav: [
    { label: 'Research', href: '/' },
    { label: 'About', href: '/about/' },
  ],
  // The starter lives in a subfolder of the engine repository; a repository root works too.
  repository: 'https://github.com/elucidatejs/elucidate/tree/main/starter',
  math: {
    macros: { '\\R': '\\mathbb{R}', '\\norm': '\\left\\lVert #1 \\right\\rVert' },
  },
});
