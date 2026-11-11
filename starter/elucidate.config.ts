import { defineConfig } from 'astro-elucidate/config';

export default defineConfig({
  title: 'Elucidate',
  url: 'https://elucidatejs.github.io/elucidate',
  description: 'Web-native scientific articles, in the spirit of Distill.',
  nav: [
    { label: 'Research', href: '/' },
    { label: 'About', href: '/about/' },
  ],
  repository: 'https://github.com/elucidatejs/elucidate',
});
