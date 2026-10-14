import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { contexts } from './contexts.mjs';

for (const { name: scope, require } of contexts) {
  const coreRequire = createRequire(require.resolve('@docusaurus/core/package.json'));
  const { default: Tinypool } = await import(pathToFileURL(coreRequire.resolve('tinypool')).href);

  test(
    `${scope}: SSG pool runs queued tasks with configured worker data`,
    { timeout: 10_000 },
    async t => {
      const root = mkdtempSync(join(tmpdir(), 'starter-toolchain-pool-'));
      const filename = join(root, 'worker.mjs');
      writeFileSync(
        filename,
        `import {workerData, threadId} from 'node:worker_threads';
const params = workerData[1].params;
export default async ({pathnames}) => pathnames.map(pathname => ({pathname, marker:params.marker, threadId, workerId:process.__tinypool_state__.workerId}));`
      );
      let pool;
      t.after(async () => {
        try {
          await pool?.destroy();
        } finally {
          rmSync(root, { recursive: true, force: true });
        }
      });
      pool = new Tinypool({
        filename,
        minThreads: 2,
        maxThreads: 2,
        concurrentTasksPerWorker: 1,
        runtime: 'worker_threads',
        isolateWorkers: false,
        workerData: { params: { marker: 'fixture' } },
        maxMemoryLimitBeforeRecycle: 1_000_000_000,
      });
      const tasks = Array.from({ length: 4 }, (_, index) => ({
        pathnames: [`/fixture/${index}`],
      }));
      const results = (await Promise.all(tasks.map(task => pool.run(task)))).flat();
      assert.deepEqual(
        results.map(item => item.pathname),
        tasks.flatMap(task => task.pathnames)
      );
      for (const item of results) {
        assert.equal(item.marker, 'fixture');
        assert.ok(item.threadId > 0);
        assert.ok(item.workerId > 0);
      }
    }
  );
}
