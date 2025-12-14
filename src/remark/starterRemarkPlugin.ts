import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

export type StarterRemarkPluginOptions = {
  /**
   * Matches text nodes that contain this marker. Defaults to 'TODO'.
   */
  marker?: string;
  /**
   * Replacement text for the marker. Defaults to turning `TODO` into `✅ TODO`.
   */
  replacement?: string;
};

/**
 * A tiny remark plugin provided as an example for the starter template.
 *
 * The plugin looks for text nodes that contain a configurable marker (default `TODO`)
 * and prefixes them with a replacement string. This is intentionally simple – swap
 * the implementation with whatever behaviour your plugin needs.
 */
export const starterRemarkPlugin: Plugin<[StarterRemarkPluginOptions?]> = (options = {}) => {
  const marker = options.marker ?? 'TODO';
  const replacement = options.replacement ?? '✅ TODO';

  return tree => {
    visit(tree, 'text', (node: any) => {
      if (typeof node.value !== 'string') return;
      if (!node.value.includes(marker)) return;

      node.value = node.value.replaceAll(marker, replacement);
    });
  };
};

/**
 * Convenience helper so the plugin can be configured succinctly from Docusaurus config.
 */
export function createStarterRemarkPlugin(options?: StarterRemarkPluginOptions) {
  return [starterRemarkPlugin, options ?? {}] as const;
}

/**
 * Extracts internal links from a markdown AST.
 * Returns an array of link targets (href values) that are internal links.
 */
export function extractLinksFromMarkdown(content: string): string[] {
  const links: string[] = [];

  // Match markdown links: [text](url) - capture the url part
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const href = match[2];
    // Filter for internal links (relative paths, not external URLs)
    if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
      // Normalize the link
      const normalizedLink = normalizeInternalLink(href);
      if (normalizedLink) {
        links.push(normalizedLink);
      }
    }
  }

  // Also match wiki-style links: [[page]] or [[page|alias]]
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target) {
      links.push(normalizeInternalLink(target) || target);
    }
  }

  return [...new Set(links)]; // Remove duplicates
}

/**
 * Normalizes an internal link to a consistent format.
 * Removes file extensions, anchors, and normalizes path separators.
 */
function normalizeInternalLink(href: string): string | null {
  if (!href) return null;

  // Remove query strings and anchors
  let normalized = href.split('?')[0].split('#')[0];

  // Remove common file extensions
  normalized = normalized.replace(/\.(md|mdx)$/i, '');

  // Remove leading ./ or /
  normalized = normalized.replace(/^\.\//, '').replace(/^\//, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized || null;
}

/**
 * Extracts the title from markdown content.
 * Looks for frontmatter title or first h1 heading.
 */
export function extractTitleFromMarkdown(content: string, fallbackName: string): string {
  // Try to extract from frontmatter
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/^title:\s*["']?([^"'\n]+)["']?\s*$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Try to find first h1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fallback to filename-based title
  return formatTitleFromFilename(fallbackName);
}

/**
 * Formats a filename into a human-readable title.
 */
function formatTitleFromFilename(filename: string): string {
  // Remove extension and path
  const name = filename.replace(/\.(md|mdx)$/i, '').split('/').pop() || filename;

  // Convert kebab-case or snake_case to Title Case
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Extracts the slug from a markdown file path.
 */
export function extractSlugFromPath(filePath: string, docsDir: string): string {
  // Remove the docs directory prefix
  let slug = filePath.replace(new RegExp(`^${docsDir}/?`), '');

  // Remove file extension
  slug = slug.replace(/\.(md|mdx)$/i, '');

  // Handle index files
  slug = slug.replace(/\/index$/, '');

  // Remove leading slash
  slug = slug.replace(/^\//, '');

  return slug || 'index';
}

/**
 * Extracts the group/category from a file path.
 */
export function extractGroupFromPath(filePath: string): string {
  const parts = filePath.split('/');
  // If there's a directory, use it as the group
  if (parts.length > 1) {
    return parts[0];
  }
  return 'root';
}
