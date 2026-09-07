# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`docusaurus-plugin-starter` — a template for building Docusaurus v3 plugins. Users fork it and strip it down; it is not a library meant for production consumption.

- Entry: `src/index.ts` re-exports the plugin factory, types, and a helper remark plugin.
- Lifecycle demo: `src/plugin.ts` shows `loadContent`, `contentLoaded`, `getClientModules`, `getThemePath`.
- Client + theme: `src/client/index.ts` and `src/theme/StarterMessage` are example artefacts.
- Remark demo: `src/remark/starterRemarkPlugin.ts`.
- Example site: `examples/docusaurus-v3/` consumes the built `dist/` via a local path.
- Build: `tsup` outputs `dist/` as ESM + CJS with `.d.ts`.

See also `AGENTS.md` for the broader skill list this repo exposes.

## Stack

- TypeScript, React 18 peer, Docusaurus v3 peer
- Vitest for unit tests
- tsup for builds
- Prettier + ESLint
- Node >=20

## Commands

- `npm run build` / `npm run dev` — tsup (dev = watch)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` / `test:watch` / `test:coverage` — Vitest
- `npm run example:start|build|serve|clear` — helpers for the bundled example site
- `npm run lint` / `lint:fix` — ESLint
- `npm run format` / `format:check` — Prettier

## Conventions

- TDD where practical; colocate tests with implementation or under `__tests__/` / `tests/`.
- Prefer concise, well-named functions over comments.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Sentence case in docs.
- Update `CHANGELOG.md` under "Unreleased" for user-facing changes.
- Because this is a **template**, breaking changes to the scaffold should be rare and obvious in release notes — downstream forks don't get them automatically.

## Task tracking

Use GitHub issues for new work. Reference with `Fixes #N` / `Closes #N` in PRs.

## Shared docs site

User-facing changes in this repo should also be reflected in the shared documentation site at `~/Development/docusaurus/docusaurus-plugins-docs/` (separate repo; documents and dogfoods every plugin in this family).

After a change that a consumer can observe — new option, changed default, renamed export, new/removed hook, changed scaffold behavior — update both:

- `README.md` here (canonical reference)
- `docs/starter/` in `docusaurus-plugins-docs`, at minimum `getting-started.md` and `what-you-get.md`; also `overview.md` / the relevant `advanced/*.md` (lifecycle hooks, remark integration) when the change reaches those topics

Internal refactors, test-only changes, and build tweaks don't need docs-site updates.

The docs site does **not** register this plugin as a live demo (starter is a template, not a library — its `StarterPage` route has SSR issues when installed from a sibling dir). Consumers are directed to the `examples/docusaurus-v3/` inside this repo instead.
