/**
 * Configuration options for the Obsidian Graph plugin.
 */
export type PluginStarterOptions = {
  /**
   * Enable or disable the plugin.
   */
  enabled?: boolean;
  /**
   * The URL path where the graph visualization will be available.
   * @default '/graph'
   */
  routePath?: string;
  /**
   * Title displayed on the graph page.
   * @default 'Knowledge Graph'
   */
  graphTitle?: string;
  /**
   * Path to the docs directory to scan for markdown files.
   * @default 'docs'
   */
  docsDir?: string;
  /**
   * Node styling options.
   */
  nodeStyle?: {
    /**
     * Default node radius in pixels.
     * @default 6
     */
    radius?: number;
    /**
     * Node color for regular nodes.
     * @default '#a78bfa'
     */
    color?: string;
    /**
     * Node color when hovered.
     * @default '#c4b5fd'
     */
    hoverColor?: string;
    /**
     * Color for the currently active/selected node.
     * @default '#f472b6'
     */
    activeColor?: string;
  };
  /**
   * Link styling options.
   */
  linkStyle?: {
    /**
     * Link color.
     * @default '#4b5563'
     */
    color?: string;
    /**
     * Link width in pixels.
     * @default 1
     */
    width?: number;
    /**
     * Link opacity (0-1).
     * @default 0.6
     */
    opacity?: number;
  };
  /**
   * Force simulation options.
   */
  simulation?: {
    /**
     * Repulsion strength between nodes (negative values push apart).
     * @default -300
     */
    chargeStrength?: number;
    /**
     * Target distance between linked nodes.
     * @default 100
     */
    linkDistance?: number;
    /**
     * Strength of centering force.
     * @default 0.05
     */
    centerStrength?: number;
  };
};

/**
 * Represents a node in the graph (a document/page).
 */
export type GraphNode = {
  /**
   * Unique identifier for the node (typically the file path or slug).
   */
  id: string;
  /**
   * Display label for the node (document title).
   */
  label: string;
  /**
   * URL path to navigate to when clicking the node.
   */
  path: string;
  /**
   * Number of connections (links) this node has.
   */
  connections: number;
  /**
   * Optional group for categorizing nodes (e.g., by directory).
   */
  group?: string;
};

/**
 * Represents a link/edge between two nodes.
 */
export type GraphLink = {
  /**
   * ID of the source node.
   */
  source: string;
  /**
   * ID of the target node.
   */
  target: string;
};

/**
 * The complete graph data structure.
 */
export type GraphData = {
  /**
   * All nodes in the graph.
   */
  nodes: GraphNode[];
  /**
   * All links between nodes.
   */
  links: GraphLink[];
};

/**
 * Content returned by the plugin's loadContent hook.
 */
export type StarterPluginContent = {
  /**
   * The graph data structure.
   */
  graphData: GraphData;
  /**
   * The route path for the graph page.
   */
  routePath: string;
  /**
   * Title for the graph page.
   */
  graphTitle: string;
  /**
   * Resolved styling options.
   */
  options: Required<Pick<PluginStarterOptions, 'nodeStyle' | 'linkStyle' | 'simulation'>>;
};

/**
 * Link information extracted from markdown files.
 */
export type ExtractedLink = {
  /**
   * The source file path.
   */
  from: string;
  /**
   * The target path/slug referenced in the link.
   */
  to: string;
};

/**
 * Document metadata extracted during content loading.
 */
export type DocumentMeta = {
  /**
   * File path relative to docs directory.
   */
  filePath: string;
  /**
   * Document title (from frontmatter or first heading).
   */
  title: string;
  /**
   * URL slug for the document.
   */
  slug: string;
  /**
   * Internal links found in the document.
   */
  links: string[];
  /**
   * Directory/category the document belongs to.
   */
  group: string;
};
