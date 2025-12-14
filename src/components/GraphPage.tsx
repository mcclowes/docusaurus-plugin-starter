import Layout from '@theme/Layout';
import ObsidianGraph from './ObsidianGraph.js';
import type { StarterPluginContent } from '../types.js';
import styles from './GraphPage.module.css';

type GraphPageProps = {
  readonly modules: {
    readonly graphData: StarterPluginContent;
  };
};

const DEFAULT_DATA: StarterPluginContent = {
  graphData: { nodes: [], links: [] },
  routePath: '/graph',
  graphTitle: 'Knowledge Graph',
  options: {
    nodeStyle: {
      radius: 6,
      color: '#a78bfa',
      hoverColor: '#c4b5fd',
      activeColor: '#f472b6',
    },
    linkStyle: {
      color: '#4b5563',
      width: 1,
      opacity: 0.6,
    },
    simulation: {
      chargeStrength: -300,
      linkDistance: 100,
      centerStrength: 0.05,
    },
  },
};

export default function GraphPage({ modules }: GraphPageProps) {
  // Handle SSR/SSG case where modules might be undefined
  const data = modules?.graphData ?? DEFAULT_DATA;

  return (
    <Layout
      title={data.graphTitle}
      description="Interactive knowledge graph visualization showing document connections"
    >
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{data.graphTitle}</h1>
          <p className={styles.subtitle}>
            Explore the connections between documents. Click a node to select it, double-click to
            navigate. Use mouse wheel to zoom, drag to pan.
          </p>
        </header>

        <div className={styles.graphContainer}>
          {data.graphData.nodes.length > 0 ? (
            <ObsidianGraph data={data} />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="6" cy="6" r="2" />
                  <circle cx="18" cy="6" r="2" />
                  <circle cx="6" cy="18" r="2" />
                  <circle cx="18" cy="18" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <line x1="8" y1="6" x2="10" y2="10" />
                  <line x1="16" y1="6" x2="14" y2="10" />
                  <line x1="8" y1="18" x2="10" y2="14" />
                  <line x1="16" y1="18" x2="14" y2="14" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>No documents found</h2>
              <p className={styles.emptyText}>
                Add markdown files to your docs directory and link them together to see the
                knowledge graph.
              </p>
            </div>
          )}
        </div>

        <section className={styles.help}>
          <h2 className={styles.helpTitle}>How to use</h2>
          <div className={styles.helpGrid}>
            <div className={styles.helpItem}>
              <span className={styles.helpIcon}>🖱️</span>
              <div>
                <strong>Navigate</strong>
                <p>Drag to pan, scroll to zoom</p>
              </div>
            </div>
            <div className={styles.helpItem}>
              <span className={styles.helpIcon}>👆</span>
              <div>
                <strong>Select</strong>
                <p>Click a node to see details</p>
              </div>
            </div>
            <div className={styles.helpItem}>
              <span className={styles.helpIcon}>👆👆</span>
              <div>
                <strong>Open</strong>
                <p>Double-click to open the page</p>
              </div>
            </div>
            <div className={styles.helpItem}>
              <span className={styles.helpIcon}>✋</span>
              <div>
                <strong>Drag nodes</strong>
                <p>Drag nodes to rearrange</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
