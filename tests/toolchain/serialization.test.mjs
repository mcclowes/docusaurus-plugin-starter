import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { contexts } from './contexts.mjs';

for (const { name: scope, require } of contexts) {
  for (const consumer of ['copy-webpack-plugin', 'css-minimizer-webpack-plugin']) {
    test(`${scope}: ${consumer}: serialized options preserve functions, patterns, and dates`, () => {
      const consumerRequire = createRequire(require.resolve(`${consumer}/package.json`));
      const serialize = consumerRequire('serialize-javascript');
      const source = {
        configure: value => value * 2,
        pattern: /a+b/gi,
        created: new Date('2026-01-01T00:00:00.000Z'),
        text: '</script><example>',
      };
      const encoded = serialize(source);
      assert.doesNotMatch(encoded, /<\/script>/i);
      const restored = runInNewContext(`(${encoded})`);
      assert.equal(restored.configure(21), 42);
      assert.equal(restored.pattern.source, 'a+b');
      assert.equal(restored.pattern.flags, 'gi');
      assert.equal(restored.created.toISOString(), source.created.toISOString());
      assert.equal(restored.text, source.text);
    });
  }
}
