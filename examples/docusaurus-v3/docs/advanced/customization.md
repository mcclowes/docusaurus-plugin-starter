---
title: Advanced Customization
---

# Advanced Customization

Take full control of the graph visualization with advanced customization options.

## Custom Theming

The graph respects your Docusaurus theme. Colors automatically adjust for light and dark mode.

## CSS Variables

Override these CSS variables to match your brand:

```css
:root {
  --graph-bg-start: #0f0f1a;
  --graph-bg-end: #16213e;
  --graph-node-color: #a78bfa;
  --graph-link-color: #4b5563;
}
```

## Component Swizzling

You can swizzle the graph component for complete control:

```bash
npm run swizzle docusaurus-plugin-obsidian-graph ObsidianGraph
```

## Embedding the Graph

Use the graph component in any page:

```jsx
import ObsidianGraph from '@theme/ObsidianGraph';

<ObsidianGraph />
```

## Related Documentation

- [Features Overview](./features) - All plugin features
- [Basic Configuration](../graph-config) - Configuration options
- [Using Global Data](../manual-link) - Programmatic access
- [Introduction](../intro) - Getting started
