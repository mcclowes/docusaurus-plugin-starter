import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { LoadContext, Plugin } from '@docusaurus/types';
import type {
  PluginStarterOptions,
  StarterPluginContent,
  GraphNode,
  GraphLink,
  GraphData,
  DocumentMeta,
} from './types.js';
import {
  extractLinksFromMarkdown,
  extractTitleFromMarkdown,
  extractSlugFromPath,
  extractGroupFromPath,
} from './remark/starterRemarkPlugin.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Default styling options
const DEFAULT_NODE_STYLE = {
  radius: 6,
  color: '#a78bfa',
  hoverColor: '#c4b5fd',
  activeColor: '#f472b6',
};

const DEFAULT_LINK_STYLE = {
  color: '#4b5563',
  width: 1,
  opacity: 0.6,
};

const DEFAULT_SIMULATION = {
  chargeStrength: -300,
  linkDistance: 100,
  centerStrength: 0.05,
};

export default function pluginObsidianGraph(
  context: LoadContext,
  options: PluginStarterOptions = {}
): Plugin<StarterPluginContent | undefined> {
  const { siteDir } = context;

  const resolvedOptions = {
    enabled: options.enabled ?? true,
    routePath: options.routePath ?? '/graph',
    graphTitle: options.graphTitle ?? 'Knowledge Graph',
    docsDir: options.docsDir ?? 'docs',
    nodeStyle: { ...DEFAULT_NODE_STYLE, ...options.nodeStyle },
    linkStyle: { ...DEFAULT_LINK_STYLE, ...options.linkStyle },
    simulation: { ...DEFAULT_SIMULATION, ...options.simulation },
  };

  return {
    name: 'docusaurus-plugin-obsidian-graph',

    async loadContent() {
      if (!resolvedOptions.enabled) return undefined;

      const docsPath = path.join(siteDir, resolvedOptions.docsDir);

      // Check if docs directory exists
      if (!(await fs.pathExists(docsPath))) {
        console.warn(
          `[obsidian-graph] Docs directory not found: ${docsPath}. Graph will be empty.`
        );
        return {
          graphData: { nodes: [], links: [] },
          routePath: resolvedOptions.routePath,
          graphTitle: resolvedOptions.graphTitle,
          options: {
            nodeStyle: resolvedOptions.nodeStyle,
            linkStyle: resolvedOptions.linkStyle,
            simulation: resolvedOptions.simulation,
          },
        };
      }

      // Scan for markdown files
      const documents = await scanDocsDirectory(docsPath, resolvedOptions.docsDir);

      // Build the graph
      const graphData = buildGraph(documents, resolvedOptions.docsDir);

      return {
        graphData,
        routePath: resolvedOptions.routePath,
        graphTitle: resolvedOptions.graphTitle,
        options: {
          nodeStyle: resolvedOptions.nodeStyle,
          linkStyle: resolvedOptions.linkStyle,
          simulation: resolvedOptions.simulation,
        },
      };
    },

    async contentLoaded({ content, actions }) {
      if (!content) return;

      const { createData, addRoute, setGlobalData } = actions;

      const dataPath = await createData('graph-data.json', JSON.stringify(content, null, 2));

      addRoute({
        path: resolvedOptions.routePath,
        exact: true,
        component: path.join(currentDirPath, 'components/GraphPage.js'),
        modules: {
          graphData: dataPath,
        },
      });

      setGlobalData(content);
    },

    getClientModules() {
      if (!resolvedOptions.enabled) return [];
      return [path.join(currentDirPath, 'client/index.js')];
    },

    getThemePath() {
      return path.join(currentDirPath, 'theme');
    },
  };
}

/**
 * Recursively scans a directory for markdown files and extracts metadata.
 */
async function scanDocsDirectory(
  dirPath: string,
  docsDir: string,
  basePath: string = ''
): Promise<DocumentMeta[]> {
  const documents: DocumentMeta[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        // Recursively scan subdirectories
        const subDocs = await scanDocsDirectory(fullPath, docsDir, relativePath);
        documents.push(...subDocs);
      } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        // Process markdown file
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const links = extractLinksFromMarkdown(content);
          const title = extractTitleFromMarkdown(content, entry.name);
          const slug = extractSlugFromPath(relativePath, '');
          const group = extractGroupFromPath(relativePath);

          documents.push({
            filePath: relativePath,
            title,
            slug,
            links,
            group,
          });
        } catch (err) {
          console.warn(`[obsidian-graph] Failed to read file: ${fullPath}`, err);
        }
      }
    }
  } catch (err) {
    console.warn(`[obsidian-graph] Failed to scan directory: ${dirPath}`, err);
  }

  return documents;
}

/**
 * Builds a graph data structure from document metadata.
 */
function buildGraph(documents: DocumentMeta[], docsDir: string): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const connectionCounts = new Map<string, number>();

  // First pass: create all nodes and count connections
  for (const doc of documents) {
    const nodeId = doc.slug;

    // Initialize connection count
    connectionCounts.set(nodeId, 0);

    // Count outgoing links
    for (const link of doc.links) {
      const targetId = resolveLink(link, doc.slug);
      connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1);
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    }
  }

  // Second pass: create nodes with connection counts
  for (const doc of documents) {
    const nodeId = doc.slug;
    const node: GraphNode = {
      id: nodeId,
      label: doc.title,
      path: `/docs/${doc.slug}`,
      connections: connectionCounts.get(nodeId) || 0,
      group: doc.group,
    };

    nodes.push(node);
    nodeMap.set(nodeId, node);
  }

  // Third pass: create links (only between existing nodes)
  const linkSet = new Set<string>();

  for (const doc of documents) {
    const sourceId = doc.slug;

    for (const link of doc.links) {
      const targetId = resolveLink(link, doc.slug);

      // Only create links to nodes that exist
      if (nodeMap.has(targetId)) {
        // Create a unique key to avoid duplicate links
        const linkKey = [sourceId, targetId].sort().join('::');

        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: sourceId,
            target: targetId,
          });
        }
      }
    }
  }

  return { nodes, links };
}

/**
 * Resolves a relative link to an absolute slug.
 */
function resolveLink(link: string, currentSlug: string): string {
  // Handle absolute links
  if (link.startsWith('/')) {
    return link.slice(1).replace(/^docs\//, '');
  }

  // Handle relative links
  if (link.startsWith('../')) {
    const currentParts = currentSlug.split('/');
    currentParts.pop(); // Remove current file

    let linkParts = link.split('/');
    while (linkParts[0] === '..') {
      linkParts.shift();
      currentParts.pop();
    }

    return [...currentParts, ...linkParts].join('/');
  }

  if (link.startsWith('./')) {
    const currentParts = currentSlug.split('/');
    currentParts.pop(); // Remove current file
    return [...currentParts, link.slice(2)].join('/');
  }

  // Handle sibling links (no ./ prefix)
  const currentParts = currentSlug.split('/');
  if (currentParts.length > 1) {
    currentParts.pop();
    return [...currentParts, link].join('/');
  }

  return link;
}
