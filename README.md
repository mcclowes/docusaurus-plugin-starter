# Docusaurus Plugin Starter (TypeScript)

A minimal, strongly-typed starter for building and publishing Docusaurus v2 plugins.

- Build with TypeScript and `tsup`
- ESM and CJS outputs
- Typed options, example lifecycle hooks, client module wiring
- Clear instructions to extend, test locally, and publish to npm
- Guidance for AI assistants (Cursor, Anthropic Claude, OpenAI Codex/GPT) on Docusaurus and plugin development

## Quick start

```bash
# Install deps
npm install

# Build once
npm run build

# Watch and rebuild on change
npm run dev
```

## Install into a local Docusaurus site

From your Docusaurus site:

```bash
# Using a local path during development
npm install ../path/to/docusaurus-plugin-starter

# Or via a temporary tarball
npm pack ../path/to/docusaurus-plugin-starter
npm install ./docusaurus-plugin-starter-*.tgz
```

Add to `docusaurus.config.js` or `docusaurus.config.ts`:

```js
// docusaurus.config.js
module.exports = {
  // ... existing config ...
  plugins: [
    [
      'docusaurus-plugin-starter',
      {
        enabled: true,
        greetingMessage: 'Hello from my plugin!'
      }
    ]
  ]
}
```

Access global data set by the plugin from any theme component:

```js
// Example React component
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

export default function Greeting() {
  const { globalData } = useDocusaurusContext()
  const data = globalData['docusaurus-plugin-starter']?.default
  return <div>{data?.greeting}</div>
}
```

## What this starter includes

- `src/plugin.ts`: Minimal plugin implementing `loadContent`, `contentLoaded`, and `getClientModules`
- `src/client/index.ts`: Demonstration client module (executed in the browser)
- `src/types.ts`: Typed plugin options
- `tsup.config.ts`: Bundling to CJS and ESM with type declarations
- `package.json` exports for both server and client entry points

## Extend the plugin

Common additions:

- Add plugin options: extend `PluginStarterOptions` in `src/types.ts`
- Emit data at build time: return from `loadContent`
- Inject global data or routes: use `contentLoaded({actions})`
- Add client behavior: export additional functions from `src/client/index.ts`
- Integrate with Webpack: implement `configureWebpack()` in `src/plugin.ts`
- Provide theme components: return `getThemePath()` or `getTypeScriptThemePath()`

Example: add a simple route

```ts
// In src/plugin.ts inside contentLoaded
async contentLoaded({ actions }) {
  const { addRoute } = actions
  addRoute({
    path: '/hello-plugin',
    component: require.resolve('./client/HelloPage')
  })
}
```

Then create `src/client/HelloPage.tsx` and export a React component. The path will be available at `/hello-plugin` when the site runs.

## Publish to npm

1. Update metadata in `package.json`:
   - name: `@yourscope/docusaurus-plugin-xyz`
   - version: semantic version
   - description, repository, author, homepage, bugs
2. Build the package:
   ```bash
   npm run build
   ```
3. Login and publish:
   ```bash
   npm login
   npm publish --access public
   ```

Notes:
- The published package includes only `dist/`, `README.md`, and `LICENSE` (see `files` and `.npmignore`).
- `prepublishOnly` ensures a fresh build.

## Conventions and tips

- Keep server-only code (Node.js) out of `src/client`.
- Feature-flag behavior via `enabled` or other options.
- Prefer `setGlobalData` over ad-hoc globals.
- Use `peerDependencies` for `@docusaurus/types` to avoid duplicate installs.

## API surface (starter)

- Default export: the plugin function `(context, options) => Plugin`
- Types: `PluginStarterOptions`
- Client module: `client/index` with `onRouteDidUpdate` example

## For AI assistants (Cursor, Claude, Codex/GPT)

- What is Docusaurus?
  - Docusaurus is a React/MDX static site generator. A "plugin" runs during build/serve in Node.js and can:
    - Load content (files, data sources)
    - Create routes/pages and inject global data
    - Provide client modules that run in the browser
    - Optionally provide theme components (UI) for the site

- How to build a plugin here
  - Implement or extend logic in `src/plugin.ts` using Docusaurus `Plugin` hooks:
    - `loadContent()` → read/process data at build time
    - `contentLoaded({content, actions})` → create routes or set global data
    - `getClientModules()` → return paths to client-side modules
    - Optional hooks include `getThemePath()`, `getTypeScriptThemePath()`, `configureWebpack()`
  - Define and export typed options in `src/types.ts` and re-export from `src/index.ts`
  - Ensure new client code lives under `src/client/` and uses browser-safe APIs

- How to test locally
  - Link into a Docusaurus site with `npm install ../path` or `npm pack`
  - Inspect generated routes and `globalData` via `@docusaurus/useDocusaurusContext`

- Publishing checklist
  - Update `package.json` metadata, run `npm run build`, then `npm publish --access public`
  - Consider adding CI release automation (e.g., Changesets) later

- Guardrails for assistants
  - Do not import server-only modules into `src/client/*`
  - Keep plugin entry point at `src/index.ts` and default export the plugin
  - Preserve ESM/CJS dual output in `package.json` `exports`
  - Update `tsup.config.ts` entries if new entry points are added

## License

MIT

