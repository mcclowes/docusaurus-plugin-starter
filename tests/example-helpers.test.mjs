import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { URL } from 'node:url';

const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run helper tests through npm.');
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;

for (const command of ['start', 'build', 'serve', 'clear']) {
  for (const args of [
    [],
    ['--config', 'config with spaces.mjs', '--out-dir', 'output with spaces', '--port', '4317'],
  ]) {
    test(`example:${command} forwards ${args.length ? 'custom options' : 'no options'}`, t => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'starter example helpers ')));
      t.after(() => rmSync(root, { recursive: true, force: true }));
      const example = join(root, 'examples', 'docusaurus-v3');
      mkdirSync(example, { recursive: true });
      const name = `example:${command}`;
      assert.match(scripts[name], /^npm /);
      // Keep both npm layers real while isolating fixtures from personal command wrappers.
      const helper = scripts[name].replace(/^npm /, `${quote(process.execPath)} ${quote(npmCli)} `);
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ private: true, scripts: { [name]: helper } })
      );
      writeFileSync(
        join(example, 'package.json'),
        JSON.stringify({ private: true, scripts: { [command]: 'node record-args.cjs' } })
      );
      writeFileSync(
        join(example, 'record-args.cjs'),
        'console.log("fixture-argv:" + JSON.stringify({cwd:process.cwd(), args:process.argv.slice(2)}));'
      );
      const result = spawnSync(process.execPath, [npmCli, '--silent', 'run', name, '--', ...args], {
        cwd: root,
        encoding: 'utf8',
        timeout: 10_000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const record = result.stdout.split('\n').find(line => line.startsWith('fixture-argv:'));
      assert.ok(record, result.stdout + result.stderr);
      assert.deepEqual(JSON.parse(record.slice('fixture-argv:'.length)), { cwd: example, args });
    });
  }
}
