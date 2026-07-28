import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Replace __PORT__ with the actual port for this SPA.
// Port map: hub=5173 game=5174 dating=5176 trade=5177 sports=5178 admin-dashboard=5180
// Replace __APPNAME__ with the app name (e.g. "hub", "game", "trading", etc.)
// Replace __THEME_COLOR__ with the app primary color hex (e.g. "#3b82f6")

export default defineConfig({
  cacheDir: '../../node_modules/.vite-cache',

  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.png', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name:             'LKVIP — __APPNAME__',
        short_name:       '__APPNAME__',
        description:      'LKVIP GROUP — __APPNAME__',
        theme_color:      '__THEME_COLOR__',
        background_color: '#0f172a',
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
              cacheName: '__APPNAME__-api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: '__APPNAME__-image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
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

  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',

  server: {
    port: __PORT__,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads':   { target: 'http://localhost:5000', changeOrigin: true },
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
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('socket.io-client'))      return 'socket-vendor';
          if (id.includes('lucide-react'))           return 'ui-vendor';
          if (id.includes('zustand'))                return 'state-vendor';
          if (id.includes('axios'))                  return 'http-vendor';
        },
      },
    },
  },
});
