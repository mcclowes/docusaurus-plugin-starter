import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

export const contexts = [
  ['root', '../../package.json'],
  ['example', '../../examples/docusaurus-v3/package.json'],
].map(([name, path]) => {
  const packageUrl = new URL(path, import.meta.url);
  assert.ok(
    existsSync(new URL('./node_modules/@docusaurus/core/package.json', packageUrl)),
    `${name} toolchain must be installed before testing`
  );
  return { name, require: createRequire(packageUrl) };
});
