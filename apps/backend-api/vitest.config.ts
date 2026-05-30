import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [resolve(currentDir, 'src/test/setup.ts')],
  },
  resolve: {
    alias: {
      '@': resolve(currentDir, 'src'),
      '@shared/types': resolve(currentDir, '../../packages/shared-types/src'),
    },
  },
});
