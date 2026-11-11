/// <reference types="astro/client" />

declare module 'virtual:elucidate/config' {
  const config: import('./config.ts').ElucidateConfig;
  export default config;
}

/** Imports the site's src/styles/theme.css when it exists. */
declare module 'virtual:elucidate/user-styles' {}
