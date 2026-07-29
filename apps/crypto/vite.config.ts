import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  cacheDir: '../../node_modules/.vite-cache',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'LKVIP Crypto',
        short_name: 'Crypto',
        description: 'LKVIP GROUP — Theo dõi thị trường crypto',
        theme_color: '#6366f1',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'vi',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@':            path.resolve(__dirname, './src'),
      '@ui':          path.resolve(__dirname, '../../packages/ui/src'),
      '@lkvip/types': path.resolve(__dirname, '../../packages/types/src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  base: '/',
  server: {
    port: 5183,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router')) return 'react-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('recharts'))              return 'chart-vendor';
          if (id.includes('lucide-react'))           return 'ui-vendor';
        },
      },
    },
  },
});
