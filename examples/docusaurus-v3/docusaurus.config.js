import path from 'path';
import { fileURLToPath } from 'url';
import pluginObsidianGraph from '../../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('@docusaurus/types').Config} */
export default {
  title: 'Obsidian Graph Plugin Example',
  url: 'https://example.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'example',
  projectName: 'obsidian-graph-example-site',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */ ({
        docs: {
          sidebarPath: path.resolve(__dirname, './sidebars.js'),
          remarkPlugins: [
            pluginObsidianGraph.createStarterRemarkPlugin({
              marker: 'NOTE',
              replacement: '💡 NOTE',
            }),
          ],
        },
        blog: false,
        pages: {
          remarkPlugins: [
            pluginObsidianGraph.createStarterRemarkPlugin({
              marker: 'NOTE',
              replacement: '💡 NOTE',
            }),
          ],
        },
        theme: {
          customCss: path.resolve(__dirname, './src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      // Use the local plugin from the repo root
      path.resolve(__dirname, '../../dist'),
      {
        // Obsidian Graph plugin options
        routePath: '/graph',
        graphTitle: 'Knowledge Graph',
        docsDir: 'docs',
        nodeStyle: {
          radius: 6,
          color: '#a78bfa',
          hoverColor: '#c4b5fd',
          activeColor: '#f472b6',
        },
        linkStyle: {
          color: '#4b5563',
          width: 1,
          opacity: 0.6,
        },
        simulation: {
          chargeStrength: -300,
          linkDistance: 100,
          centerStrength: 0.05,
        },
      },
    ],
    // Plugin to configure webpack to ignore Node.js modules
    function () {
      return {
        name: 'webpack-node-modules-config',
        configureWebpack(config, isServer) {
          return {
            resolve: {
              fallback: {
                path: false,
                url: false,
                fs: false,
                'fs-extra': false,
                'graceful-fs': false,
                jsonfile: false,
                util: false,
                assert: false,
                stream: false,
                constants: false,
              },
            },
          };
        },
      };
    },
  ],

  themeConfig: {
    navbar: {
      title: 'Obsidian Graph',
      items: [
        { to: '/docs/intro', label: 'Docs', position: 'left' },
        { to: '/graph', label: 'Graph', position: 'left' },
      ],
    },
  },
};
