---
title: Graph Configuration
---

# Graph Configuration

Customize the appearance and behavior of your knowledge graph through plugin options.

## Basic Configuration

```js
plugins: [
  [
    'docusaurus-plugin-obsidian-graph',
    {
      routePath: '/graph',
      graphTitle: 'Knowledge Graph',
      docsDir: 'docs',
    },
  ],
],
```

## Node Styling

Customize how nodes appear in the graph:

```js
{
  nodeStyle: {
    radius: 6,           // Base node size
    color: '#a78bfa',    // Default node color
    hoverColor: '#c4b5fd', // Color when hovered
    activeColor: '#f472b6', // Color when selected
  },
}
```

## Link Styling

Configure the appearance of connections:

```js
{
  linkStyle: {
    color: '#4b5563',    // Link color
    width: 1,            // Link thickness
    opacity: 0.6,        // Link opacity (0-1)
  },
}
```

## Simulation Settings

Control the physics simulation:

```js
{
  simulation: {
    chargeStrength: -300,  // Repulsion between nodes
    linkDistance: 100,     // Target distance between linked nodes
    centerStrength: 0.05,  // Strength of centering force
  },
}
```

## Related

- [Introduction](./intro) - Getting started guide
- [Using Global Data](./manual-link) - Access graph data programmatically
- [Advanced Customization](./advanced/customization) - Deep dive into customization
