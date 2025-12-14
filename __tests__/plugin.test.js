import pluginObsidianGraphModule from '../src/index.ts';

const pluginObsidianGraph = pluginObsidianGraphModule.default || pluginObsidianGraphModule;

describe('pluginObsidianGraph', () => {
  const context = { siteDir: '/tmp' };

  it('returns a plugin with the expected name', () => {
    const plugin = pluginObsidianGraph(context, {});
    expect(plugin.name).toBe('docusaurus-plugin-obsidian-graph');
  });

  it('skips work when disabled', async () => {
    const plugin = pluginObsidianGraph(context, { enabled: false });
    expect(await plugin.loadContent()).toBeUndefined();
    expect(plugin.getClientModules()).toEqual([]);
  });

  it('loads graph content with defaults when docs dir does not exist', async () => {
    const plugin = pluginObsidianGraph(context, {});
    const content = await plugin.loadContent();

    expect(content).toMatchObject({
      graphData: { nodes: [], links: [] },
      routePath: '/graph',
      graphTitle: 'Knowledge Graph',
    });
    expect(content.options).toMatchObject({
      nodeStyle: expect.objectContaining({ radius: 6 }),
      linkStyle: expect.objectContaining({ width: 1 }),
      simulation: expect.objectContaining({ chargeStrength: -300 }),
    });
  });

  it('wires contentLoaded helpers', async () => {
    const plugin = pluginObsidianGraph(context, { graphTitle: 'Test Graph' });
    const content = await plugin.loadContent();
    const createData = jest.fn(() => Promise.resolve('/generated/data.json'));
    const addRoute = jest.fn();
    const setGlobalData = jest.fn();

    await plugin.contentLoaded({
      content,
      actions: { createData, addRoute, setGlobalData },
    });

    expect(createData).toHaveBeenCalledWith(
      'graph-data.json',
      expect.stringContaining('"Test Graph"')
    );
    expect(addRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/graph',
        exact: true,
      })
    );
    expect(setGlobalData).toHaveBeenCalledWith(content);
  });

  it('resolves client module and theme paths', () => {
    const plugin = pluginObsidianGraph(context, {});
    expect(plugin.getClientModules()[0]).toContain('client/index.js');
    expect(plugin.getThemePath()).toContain('theme');
  });

  it('accepts custom route path', async () => {
    const plugin = pluginObsidianGraph(context, { routePath: '/my-graph' });
    const content = await plugin.loadContent();

    expect(content.routePath).toBe('/my-graph');
  });

  it('accepts custom styling options', async () => {
    const plugin = pluginObsidianGraph(context, {
      nodeStyle: { radius: 10, color: '#ff0000' },
      linkStyle: { width: 2 },
    });
    const content = await plugin.loadContent();

    expect(content.options.nodeStyle.radius).toBe(10);
    expect(content.options.nodeStyle.color).toBe('#ff0000');
    expect(content.options.linkStyle.width).toBe(2);
  });
});
