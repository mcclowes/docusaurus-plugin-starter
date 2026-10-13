import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

test('example configuration loads and transforms docs and pages text', async () => {
  const { default: config } = await import('../examples/docusaurus-v3/docusaurus.config.mjs');
  const [, presetOptions] = config.presets.find(([name]) => name === '@docusaurus/preset-classic');

  for (const section of ['docs', 'pages']) {
    const tree = { type: 'root', children: [{ type: 'text', value: 'NOTE: hello' }] };
    for (const [remarkPlugin, options] of presetOptions[section].remarkPlugins) {
      remarkPlugin(options)(tree);
    }
    assert.equal(tree.children[0].value, '💡 NOTE: hello', `${section} remark transform`);
  }
});

for (const format of ['import', 'require']) {
  const load = name => (format === 'import' ? import(name) : require(name));

  test(`${format} loads the package and resolves its emitted plugin assets`, async () => {
    const { default: pluginStarter } = await load('docusaurus-plugin-starter');
    assert.equal(typeof pluginStarter, 'function');
    const plugin = pluginStarter(
      {},
      { greetingMessage: 'Packaged greeting', routePath: '/packaged' }
    );
    const content = await plugin.loadContent();
    assert.deepEqual(content, { greeting: 'Packaged greeting', routePath: '/packaged' });
    let route;
    let globalData;
    await plugin.contentLoaded({
      content,
      actions: {
        createData: async (_name, data) => {
          assert.deepEqual(JSON.parse(data), content);
          return '/generated/starter.json';
        },
        addRoute: value => {
          route = value;
        },
        setGlobalData: value => {
          globalData = value;
        },
      },
    });
    assert.equal(route.path, '/packaged');
    assert.deepEqual(route.modules, { starterData: '/generated/starter.json' });
    assert.deepEqual(globalData, content);
    for (const asset of [route.component, plugin.getThemePath(), ...plugin.getClientModules()]) {
      assert.ok(existsSync(asset), `Missing emitted asset: ${asset}`);
    }
  });

  test(`${format} loads the remark export and transforms text`, async () => {
    const { createStarterRemarkPlugin } = await load('docusaurus-plugin-starter/remark/starter');
    const tree = { type: 'root', children: [{ type: 'text', value: 'NOTE: hello' }] };
    const [remarkPlugin, options] = createStarterRemarkPlugin({
      marker: 'NOTE',
      replacement: 'Tip',
    });
    remarkPlugin(options)(tree);
    assert.equal(tree.children[0].value, 'Tip: hello');
  });
}
