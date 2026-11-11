// Stands in for the `virtual:elucidate/config` module in unit tests.
import { parseConfig } from '../../src/config.ts';

export default parseConfig({ title: 'Lab Notes', url: 'https://example.github.io/lab-notes' });
