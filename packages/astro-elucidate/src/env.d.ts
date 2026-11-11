/// <reference types="astro/client" />

declare module 'virtual:elucidate/config' {
  const config: import('./config.ts').ElucidateConfig;
  export default config;
}

/** Imports the site's src/styles/theme.css when it exists. */
declare module 'virtual:elucidate/user-styles' {}

/** The math stylesheet: a URL for KaTeX's CSS and fonts, or MathJax's inline CSS. */
declare module 'virtual:elucidate/math-styles' {
  const styles: { href?: string; css?: string };
  export default styles;
}
