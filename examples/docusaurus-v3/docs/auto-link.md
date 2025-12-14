---
title: Remark plugin demo
---

# Remark plugin demo

The starter ships with a tiny remark plugin that replaces any `NOTE` markers found in markdown.
It is intentionally simple - edit `src/remark/starterRemarkPlugin.ts` to experiment with your own
transformations.

## How it works

The remark plugin processes your markdown during the build step, allowing you to transform content before it's rendered.

See the [Introduction](./intro) for an overview of all features, or check out [Using Global Data](./manual-link) to learn about sharing data with client components.

NOTE: Because this plugin runs during the MDX compilation step, you can safely use it across docs,
blog posts, and standalone pages.

## Related Topics

- [Graph Configuration](./graph-config) - Customize how links appear in the graph
- [Advanced Features](./advanced/features) - More ways to extend the plugin
