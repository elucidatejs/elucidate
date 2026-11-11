import { defineConfig } from 'astro/config';
import elucidate from 'astro-elucidate';

export default defineConfig({ integrations: [elucidate()] });
