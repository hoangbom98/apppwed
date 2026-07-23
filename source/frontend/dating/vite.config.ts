import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@':          path.resolve(__dirname, './src'),
      '@ui':        path.resolve(__dirname, '../shared-ui'),
      '@kjc/types': path.resolve(__dirname, '../../shared-types/src'),
      // Force peer deps to resolve from dating/node_modules (prevents duplicates with shared-ui)
      'react':            path.resolve(__dirname, './node_modules/react'),
      'react-dom':        path.resolve(__dirname, './node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'lucide-react':     path.resolve(__dirname, './node_modules/lucide-react'),
      'zustand':          path.resolve(__dirname, './node_modules/zustand'),
      'axios':            path.resolve(__dirname, './node_modules/axios'),
      'socket.io-client': path.resolve(__dirname, './node_modules/socket.io-client'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  // IMPORTANT for Capacitor WebView (relative asset paths)
  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',

  server: {
    port: 5176,
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
        // Use a function to allow dynamic resolution (Vite 5+ rolldown compatible)
        manualChunks: (id) => {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router-dom')) return 'react-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('framer-motion'))         return 'motion-vendor';
          if (id.includes('lucide-react'))           return 'ui-vendor';
          if (id.includes('socket.io-client'))       return 'socket-vendor';
        },
      },
    },
  },
});
