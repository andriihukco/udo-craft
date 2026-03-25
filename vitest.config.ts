import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
      '**/dist/**',
      '**/coverage/**',
    ],
    include: [
      '**/__tests__/**/*.test.{ts,tsx}',
    ],
    environment: 'jsdom',
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/admin/src'),
    },
  },
});
