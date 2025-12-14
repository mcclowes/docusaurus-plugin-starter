---
title: Using global data
---

# Using global data

The plugin demonstrates how to share data with the client bundle via `setGlobalData`. Once the
plugin runs, theme components can read the graph data and configuration.

## Accessing Plugin Data

You can access the graph data from any component using Docusaurus hooks:

```jsx
import { usePluginData } from '@docusaurus/useGlobalData';

function MyComponent() {
  const data = usePluginData('docusaurus-plugin-obsidian-graph');
  // data.graphData contains nodes and links
}
```

See the [Introduction](./intro) for getting started, or [Remark Plugin Demo](./auto-link) for content transformation features.

NOTE: Try changing the configuration in `docusaurus.config.js`, then refresh this page to see updates.

## Related Topics

- [Graph Configuration](./graph-config) - All configuration options
- [Advanced Customization](./advanced/customization) - Deep customization guide
