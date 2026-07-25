import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  cacheDir: '../../node_modules/.vite-cache',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'logo.svg'],
      manifest: {
        name:             'LKVIP Game',
        short_name:       'Game',
        description:      'LKVIP GROUP — Slots, Xổ số, Casino, Live, VIP',
        theme_color:      '#8b5cf6',
        background_color: '#0f0a1e',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        scope:            '/',
        lang:             'vi',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns:  ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting:   true,
        clientsClaim:  true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'game-api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@':                path.resolve(__dirname, './src'),
      '@ui':              path.resolve(__dirname, '../../packages/ui/src'),
      '@lkvip/types':     path.resolve(__dirname, '../../packages/types/src'),
      '@lkvip/constants': path.resolve(__dirname, '../../packages/constants/src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',

  server: {
    port: 5174,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },

  build: {
    outDir:    'dist',
    sourcemap: false,
    minify:    'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      treeshake: { moduleSideEffects: false },
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router')) return 'react-vendor';
          if (id.includes('@tanstack/react-query'))  return 'query-vendor';
          if (id.includes('@tanstack/react-table'))  return 'table-vendor';
          if (id.includes('socket.io-client'))       return 'socket-vendor';
          if (id.includes('lucide-react'))            return 'ui-vendor';
          if (id.includes('framer-motion'))           return 'motion-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
        },
      },
    },
  },
});
