import { defineConfig } from 'astro/config';
import elucidate from 'astro-elucidate';
import config from './elucidate.config.ts';

export default defineConfig({ integrations: [elucidate(config)] });
