import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client/index': 'src/client/index.ts',
    'components/StarterPage': 'src/components/StarterPage.tsx',
    'theme/StarterMessage/index': 'src/theme/StarterMessage/index.tsx',
    'remark/starterRemarkPlugin': 'src/remark/starterRemarkPlugin.ts',
  },
  dts: true,
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  target: 'es2020',
  external: [
    '@docusaurus/ExecutionEnvironment',
    '@docusaurus/BrowserOnly',
    '@docusaurus/useGlobalData',
    '@docusaurus/useDocusaurusContext',
    '@theme/Layout',
    '@theme/StarterMessage',
    'react',
    'react-dom',
  ],
  loader: {
    '.css': 'copy',
  },
})
