import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Replace __PORT__ with the actual port for this SPA.
// Port map: hub=5173 game=5174 dating=5176 trade=5177 sports=5178 admin-dashboard=5180

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@':          path.resolve(__dirname, './src'),
      // shared-ui — source-direct, no build step
      '@ui':        path.resolve(__dirname, '../shared-ui'),
      // shared TypeScript types — source-direct via tsconfig paths
      '@lkvip/types': path.resolve(__dirname, '../../shared-types/src'),
      // Force peer deps to resolve from THIS SPA's node_modules.
      // This prevents React/Zustand/Axios from being duplicated when
      // shared-ui imports them.
      'react':            path.resolve(__dirname, './node_modules/react'),
      'react-dom':        path.resolve(__dirname, './node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'lucide-react':     path.resolve(__dirname, './node_modules/lucide-react'),
      'zustand':          path.resolve(__dirname, './node_modules/zustand'),
      'axios':            path.resolve(__dirname, './node_modules/axios'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  // Set base to './' for Capacitor native WebView (relative asset paths).
  // Leave as '/' for normal web deployment.
  // base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',

  server: {
    port: __PORT__,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads':   { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router-dom')) return 'react-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('lucide-react'))           return 'ui-vendor';
          if (id.includes('zustand'))                return 'state-vendor';
          if (id.includes('axios'))                  return 'http-vendor';
          if (id.includes('socket.io-client'))       return 'socket-vendor';
        },
      },
    },
  },
});
