import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export const getBaseViteConfig = () => defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
});
