import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contexts } from './contexts.mjs';

for (const { name: scope, require } of contexts) {
  test(
    `${scope}: Express preserves query/form parsing, limits, and prototype isolation`,
    { timeout: 10_000 },
    async t => {
      const express = require('express');
      const app = express();
      app.set('query parser', 'extended');
      app.get('/query', (request, response) => response.json(request.query));
      app.post(
        '/form',
        express.urlencoded({ extended: true, parameterLimit: 10 }),
        (request, response) => response.json(request.body)
      );
      app.use((error, request, response, next) => {
        void next;
        response.status(error.status || 500).json({ type: error.type });
      });
      const server = await new Promise(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
      });
      t.after(async () => {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
      });
      const base = `http://127.0.0.1:${server.address().port}`;
      const value = 'name=caf%C3%A9&list%5B%5D=one&list%5B%5D=two&nested%5Bvalue%5D=3';
      const expected = { name: 'café', list: ['one', 'two'], nested: { value: '3' } };
      const get = await globalThis.fetch(`${base}/query?${value}`, {
        signal: globalThis.AbortSignal.timeout(3000),
      });
      assert.equal(get.status, 200);
      assert.deepEqual(await get.json(), expected);
      const post = await globalThis.fetch(`${base}/form`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: value,
        signal: globalThis.AbortSignal.timeout(3000),
      });
      assert.equal(post.status, 200);
      assert.deepEqual(await post.json(), expected);
      const limited = await globalThis.fetch(`${base}/form`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: Array.from({ length: 11 }, (_, index) => `key${index}=value`).join('&'),
        signal: globalThis.AbortSignal.timeout(3000),
      });
      assert.equal(limited.status, 413);
      assert.deepEqual(await limited.json(), { type: 'parameters.too.many' });
      const guarded = await globalThis.fetch(
        `${base}/query?__proto__%5BstarterToolchainPolluted%5D=yes`,
        {
          signal: globalThis.AbortSignal.timeout(3000),
        }
      );
      assert.equal(guarded.status, 200);
      await guarded.json();
      assert.equal(Object.prototype.starterToolchainPolluted, undefined);
    }
  );
}
