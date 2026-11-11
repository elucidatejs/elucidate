import { defineConfig } from 'astro/config';
import elucidate from 'astro-elucidate';
import config from './elucidate.config';

export default defineConfig({ integrations: [elucidate(config)] });
