# docusaurus-plugin-starter

> A lean, batteries-included starter for building your own Docusaurus plugin.

- **Typed plugin skeleton** – `src/plugin.ts` shows the essential lifecycle hooks with helpful comments.
- **Client + theme wiring** – `src/client/index.ts` and `src/theme/StarterMessage` demonstrate client-side behaviour and swizzlable components.
- **Remark integration** – `src/remark/starterRemarkPlugin.ts` illustrates how to ship markdown transforms.
- **Example site** – `examples/docusaurus-v3` consumes the plugin locally so you can iterate quickly.
- **Tests + build scripts** – Vitest, TypeScript, and tsup are configured out-of-the-box.

Use this template as a launchpad: rename things, rip out the examples, and focus on your feature without rebuilding the plumbing.

## Quick start

```bash
npm install
npm run build
npm --prefix examples/docusaurus-v3 install
npm run example:start
```

- Open `http://localhost:3000/starter` to see the example route the plugin registers.
- Run `npm run watch` in a second terminal while editing `src/` so the example site can load rebuilt plugin files.
- Run `npm run build` when you are ready to consume or publish the compiled plugin in `dist/`.

## What you get

```text
├── src/
│   ├── index.ts                # Package entry – re-exports plugin + helpers
│   ├── plugin.ts               # Lifecycle hooks with typed options
│   ├── client/index.ts         # Minimal client module (logs route updates)
│   ├── components/StarterPage  # Example route wired via addRoute
│   ├── remark/starterRemarkPlugin.ts
│   └── theme/StarterMessage    # Theme component exposed for swizzling
├── tests/plugin.test.ts       # Lifecycle tests
├── tests/components/          # Route component tests
├── tests/theme/               # Theme component tests
├── tests/package.test.mjs     # Built ESM and CommonJS export checks
├── examples/docusaurus-v3/     # Local example site consuming ./dist
├── tsup.config.ts              # ESM/CommonJS bundles, declarations, and CSS copying
├── tsconfig.json               # TypeScript config (src → dist)
├── vitest.config.ts            # Vitest set up for TS/React
└── README.md                   # You are here
```

### Lifecycle hooks in play

- `loadContent` prepares data that will be shared with the client/theme.
- `contentLoaded` emits a JSON data module, adds an example route, and calls `setGlobalData`.
- `getClientModules` registers a client script that runs on every navigation.
- `getThemePath` exposes the built `dist/theme/StarterMessage` for swizzling.

Swap these hooks for the ones your plugin needs.

## Example configuration

After installing the built plugin in a Docusaurus site, configure it in `docusaurus.config.js`:

```js
import { createStarterRemarkPlugin } from 'docusaurus-plugin-starter';

export default {
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          remarkPlugins: [
            createStarterRemarkPlugin({
              marker: 'NOTE',
              replacement: '💡 NOTE',
            }),
          ],
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-starter',
      {
        greetingMessage: 'Welcome to the example site!',
        routePath: '/starter',
      },
    ],
  ],
};
```

Merge these entries into your site's existing presets and plugins. The bundled example uses the local `dist/` package instead of an installed package.

## Scripts

- `npm run build` – Bundle ESM and CommonJS, generate type declarations, and copy CSS into `dist/`.
- `npm run watch` – Rebuild on changes (perfect when the example site is running).
- `npm test` – Run Vitest against the TypeScript sources and React components.
- `npm run test:package` – Check built ESM and CommonJS exports after `npm run build`.
- `npm run typecheck` / `npm run lint` – Check TypeScript types and ESLint rules.
- `npm run format:check` – Verify Prettier formatting.
- `npm run example:*` – Helpers for the bundled Docusaurus site.

## Next steps for you

1. Rename everything (package name, README copy, example site) to match your plugin.
2. Delete the example components/tests once you understand the wiring.
3. Implement your real plugin behaviour.
4. Update the documentation with the features you ship.

## License

MIT. Ship something cool!
