import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@theme/Layout': path.resolve(rootDir, './tests/mocks/Layout.tsx'),
      '@theme/StarterMessage': path.resolve(rootDir, './src/theme/StarterMessage/index.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(
        rootDir,
        './tests/mocks/useDocusaurusContext.ts'
      ),
      '@docusaurus/useGlobalData': path.resolve(rootDir, './tests/mocks/useGlobalData.ts'),
      '@docusaurus/ExecutionEnvironment': path.resolve(
        rootDir,
        './tests/mocks/ExecutionEnvironment.ts'
      ),
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['tests/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
