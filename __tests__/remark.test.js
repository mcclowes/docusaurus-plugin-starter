import {
  extractLinksFromMarkdown,
  extractTitleFromMarkdown,
  extractSlugFromPath,
  extractGroupFromPath,
} from '../src/remark/starterRemarkPlugin.ts';

describe('extractLinksFromMarkdown', () => {
  it('extracts standard markdown links', () => {
    const content = `
      Check out [link 1](./intro) and [link 2](./getting-started).
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['intro', 'getting-started']);
  });

  it('ignores external links', () => {
    const content = `
      [External](https://example.com) and [local](./local).
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['local']);
  });

  it('ignores anchor-only links', () => {
    const content = `
      [Anchor](#section) and [local](./local).
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['local']);
  });

  it('removes file extensions', () => {
    const content = `
      [Page](./page.md) and [Other](./other.mdx).
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['page', 'other']);
  });

  it('handles wiki-style links', () => {
    const content = `
      Check [[page-one]] and [[page-two|alias]].
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['page-one', 'page-two']);
  });

  it('deduplicates links', () => {
    const content = `
      [First](./same) and [Second](./same).
    `;
    const links = extractLinksFromMarkdown(content);
    expect(links).toEqual(['same']);
  });

  it('handles relative paths', () => {
    const content = `
      [Parent](../parent) and [Current](./current).
    `;
    const links = extractLinksFromMarkdown(content);
    // Note: ../parent is preserved as-is during extraction
    // The actual path resolution happens during graph building
    expect(links).toEqual(['../parent', 'current']);
  });
});

describe('extractTitleFromMarkdown', () => {
  it('extracts title from frontmatter', () => {
    const content = `---
title: My Page Title
---

# Content`;
    expect(extractTitleFromMarkdown(content, 'fallback')).toBe('My Page Title');
  });

  it('extracts title from frontmatter with quotes', () => {
    const content = `---
title: "My Quoted Title"
---`;
    expect(extractTitleFromMarkdown(content, 'fallback')).toBe('My Quoted Title');
  });

  it('extracts title from h1 heading', () => {
    const content = `# My Heading Title

Some content here.`;
    expect(extractTitleFromMarkdown(content, 'fallback')).toBe('My Heading Title');
  });

  it('falls back to filename when no title found', () => {
    const content = `Some content without title.`;
    expect(extractTitleFromMarkdown(content, 'my-page.md')).toBe('My Page');
  });

  it('converts kebab-case to title case', () => {
    expect(extractTitleFromMarkdown('no title', 'getting-started.md')).toBe('Getting Started');
  });
});

describe('extractSlugFromPath', () => {
  it('removes file extension', () => {
    expect(extractSlugFromPath('page.md', '')).toBe('page');
  });

  it('handles nested paths', () => {
    expect(extractSlugFromPath('category/page.md', '')).toBe('category/page');
  });

  it('removes index from path', () => {
    expect(extractSlugFromPath('category/index.md', '')).toBe('category');
  });

  it('handles mdx extension', () => {
    expect(extractSlugFromPath('page.mdx', '')).toBe('page');
  });
});

describe('extractGroupFromPath', () => {
  it('extracts directory as group', () => {
    expect(extractGroupFromPath('category/page.md')).toBe('category');
  });

  it('returns root for top-level files', () => {
    expect(extractGroupFromPath('page.md')).toBe('root');
  });

  it('handles deeply nested paths', () => {
    expect(extractGroupFromPath('deep/nested/path/page.md')).toBe('deep');
  });
});
