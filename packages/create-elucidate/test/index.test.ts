import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const bin = fileURLToPath(new URL('../src/index.ts', import.meta.url));

it('prints a not-ready message until M4', () => {
  const out = execFileSync(process.execPath, [bin], { encoding: 'utf8' });
  expect(out).toContain('create-elucidate is not ready yet');
});
