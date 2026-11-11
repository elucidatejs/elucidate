import config from '../starter/elucidate.config.ts';

/** Path the starter is served under, derived from its `url` (e.g. "/elucidate/"). */
export const base = `${new URL(config.url).pathname.replace(/\/+$/, '')}/`;
