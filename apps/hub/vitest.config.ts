import { mergeConfig, defineConfig } from 'vite';
import path from 'path';
import baseConfig from '../../config/vitest/vitest.base.ts';
export default mergeConfig(baseConfig, defineConfig({
  resolve: { alias: {
    '@': path.resolve(__dirname, './src'),
    '@ui': path.resolve(__dirname, '../../packages/ui/src'),
    '@lkvip/types': path.resolve(__dirname, '../../packages/types/src'),
  }},
}));
