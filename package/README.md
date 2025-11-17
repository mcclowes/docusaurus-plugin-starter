# docusaurus-plugin-glossary

A comprehensive Docusaurus plugin that provides glossary functionality with an auto-generated glossary page, searchable terms, and inline term tooltips.

## Features

- **Auto-generated Glossary Page**: Displays all terms alphabetically with letter navigation
- **Search Functionality**: Real-time search across terms and definitions
- **GlossaryTerm Component**: Inline component for linking terms with tooltip previews
- **Responsive Design**: Mobile-friendly UI with dark mode support
- **Related Terms**: Link between related glossary terms
- **Abbreviation Support**: Display full form of abbreviated terms
- **Customizable**: Configure glossary path and route

## Installation

### For Local Use (Same Repository)

1. Copy the plugin directory to your Docusaurus site:

   ```
   src/plugins/docusaurus-plugin-glossary/
   ```

2. Add the plugin to your `docusaurus.config.js`:
   ```javascript
   plugins: [
     [
       require.resolve('./src/plugins/docusaurus-plugin-glossary'),
       {
         glossaryPath: 'glossary/glossary.json', // optional, default: 'glossary/glossary.json'
         routePath: '/glossary', // optional, default: '/glossary'
       },
     ],
   ];
   ```

### For Separate Package (To Publish)

To publish this as a separate npm package:

1. Create a new directory for the package:

   ```bash
   mkdir docusaurus-plugin-glossary
   cd docusaurus-plugin-glossary
   ```

2. Copy the plugin files:

   ```
   docusaurus-plugin-glossary/
   ├── index.js
   ├── components/
   │   ├── GlossaryPage.js
   │   └── GlossaryPage.module.css
   ├── theme/
   │   └── GlossaryTerm/
   │       ├── index.js
   │       └── styles.module.css
   ├── package.json
   └── README.md
   ```

3. Create a `package.json`:

   ```json
   {
     "name": "docusaurus-plugin-glossary",
     "version": "1.0.0",
     "description": "A Docusaurus plugin for creating and managing glossary terms",
     "main": "index.js",
     "keywords": ["docusaurus", "glossary", "plugin", "documentation"],
     "peerDependencies": {
       "@docusaurus/core": "^3.0.0",
       "react": "^18.0.0",
       "react-dom": "^18.0.0"
     },
     "dependencies": {
       "fs-extra": "^11.0.0"
     }
   }
   ```

4. Publish to npm:

   ```bash
   npm publish
   ```

5. Install in your Docusaurus site:

   ```bash
   npm install docusaurus-plugin-glossary
   ```

6. Add to your `docusaurus.config.js`:
   ```javascript
   plugins: [
     [
       'docusaurus-plugin-glossary',
       {
         glossaryPath: 'glossary/glossary.json',
         routePath: '/glossary',
       },
     ],
   ];
   ```

## Usage

### 1. Create a Glossary Data File

Create a JSON file at `glossary/glossary.json` (or your configured path):

```json
{
  "description": "A collection of technical terms and their definitions",
  "terms": [
    {
      "term": "API",
      "abbreviation": "Application Programming Interface",
      "definition": "A set of rules and protocols that allows different software applications to communicate with each other.",
      "relatedTerms": ["REST", "GraphQL"]
    },
    {
      "term": "REST",
      "abbreviation": "Representational State Transfer",
      "definition": "An architectural style for designing networked applications.",
      "relatedTerms": ["API", "HTTP"]
    }
  ]
}
```

### 2. Glossary Data Structure

Each term object can include:

- `term` (required): The glossary term
- `definition` (required): The term's definition
- `abbreviation` (optional): The full form if the term is an abbreviation
- `relatedTerms` (optional): Array of related term names
- `id` (optional): Custom ID for linking (auto-generated from term if not provided)

### 3. Using the GlossaryTerm Component

Import and use the `GlossaryTerm` component in your MDX files:

```jsx
import GlossaryTerm from '@theme/GlossaryTerm';

This website uses an <GlossaryTerm term="API" definition="Application Programming Interface">API</GlossaryTerm> to fetch data.

// Or with default display (term name):
We use <GlossaryTerm term="REST" definition="Representational State Transfer" /> for our web services.
```

The component features:

- Dotted underline styling
- Tooltip showing definition on hover
- Link to full glossary page entry
- Accessible with keyboard navigation

### 4. Accessing the Glossary Page

The glossary page is automatically available at `/glossary` (or your configured `routePath`).

Features:

- Alphabetical grouping with letter navigation
- Real-time search
- Related terms linking
- Responsive design
- Dark mode support

## Configuration Options

| Option         | Type   | Default                    | Description                                           |
| -------------- | ------ | -------------------------- | ----------------------------------------------------- |
| `glossaryPath` | string | `'glossary/glossary.json'` | Path to glossary JSON file relative to site directory |
| `routePath`    | string | `'/glossary'`              | URL path for glossary page                            |

## Customization

### Styling

The plugin uses CSS modules for styling. You can override styles by:

1. Creating custom CSS in your site's `src/css/custom.css`:

```css
/* Override glossary term styles */
.glossaryTermWrapper .glossaryTerm {
  border-bottom-color: #your-color;
}

/* Override tooltip styles */
.glossaryTermWrapper .tooltip {
  background: #your-background;
}
```

2. For advanced customization, you can swizzle the components:

```bash
npm run swizzle docusaurus-plugin-glossary GlossaryPage -- --wrap
npm run swizzle docusaurus-plugin-glossary GlossaryTerm -- --wrap
```

### Adding to Navbar

To add the glossary to your navbar, update your `docusaurus.config.js`:

```javascript
themeConfig: {
  navbar: {
    items: [
      {to: '/glossary', label: 'Glossary', position: 'left'},
      // ... other items
    ],
  },
}
```

## Examples

### Example 1: Technical Documentation

```json
{
  "description": "Technical terms used in our documentation",
  "terms": [
    {
      "term": "Webhook",
      "definition": "An HTTP callback that occurs when something happens; a simple event-notification via HTTP POST.",
      "relatedTerms": ["API", "HTTP"]
    }
  ]
}
```

### Example 2: Using in MDX

```mdx
---
title: API Documentation
---

import GlossaryTerm from '@theme/GlossaryTerm';

# Getting Started with Our API

Our <GlossaryTerm term="API" definition="Application Programming Interface" />
uses <GlossaryTerm term="REST" definition="Representational State Transfer">RESTful</GlossaryTerm>
principles to provide a simple and consistent interface.
```

## Development

### File Structure

```
docusaurus-plugin-glossary/
├── index.js                    # Main plugin file
├── components/
│   ├── GlossaryPage.js        # Glossary page component
│   └── GlossaryPage.module.css # Glossary page styles
├── theme/
│   └── GlossaryTerm/
│       ├── index.js           # Term component
│       └── styles.module.css  # Term styles
└── README.md
```

### Plugin Lifecycle

1. **loadContent**: Reads glossary JSON file
2. **contentLoaded**: Creates data file and adds route
3. **getThemePath**: Exposes theme components
4. **getPathsToWatch**: Watches glossary file for changes

## Troubleshooting

### Glossary page returns 404

- Ensure the plugin is properly configured in `docusaurus.config.js`
- Check that the `routePath` doesn't conflict with existing routes
- Run `npm run clear` to clear Docusaurus cache

### Glossary terms not showing

- Verify `glossary/glossary.json` exists at the correct path
- Check JSON syntax is valid
- Ensure `terms` array is properly formatted

### GlossaryTerm component not found

- Make sure you're importing from `@theme/GlossaryTerm`
- Try clearing cache with `npm run clear`
- Restart dev server

### Styles not applying

- Check for CSS conflicts in your custom CSS
- Ensure CSS modules are loading correctly
- Try clearing cache and rebuilding

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Built for Docusaurus v3.x
