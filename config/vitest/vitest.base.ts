import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Base Vitest config — extend per-app with correct path aliases.
 * Usage in app:
 *   import { mergeConfig } from 'vite';
 *   import baseConfig from '../../config/vitest/vitest.base.ts';
 *   export default mergeConfig(baseConfig, defineConfig({ resolve: { alias: { '@': ... } } }));
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      exclude: ['node_modules', 'dist', 'src/test', '**/*.d.ts', '**/*.config.*'],
    },
  },
});
