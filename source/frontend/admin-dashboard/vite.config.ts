import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // @admin → internal admin-dashboard src (NEVER import @ui layout/admin here)
      '@admin':     path.resolve(__dirname, './src'),
      // @ui    → shared-ui for common Button/Modal/Input/DataTable/Skeleton/etc.
      '@ui':        path.resolve(__dirname, '../shared-ui'),
      // @kjc/types → shared TypeScript types (resolved from source, no build needed)
      '@kjc/types': path.resolve(__dirname, '../../shared-types/src'),
      // Force peer deps to resolve from admin-dashboard/node_modules
      'react':            path.resolve(__dirname, './node_modules/react'),
      'react-dom':        path.resolve(__dirname, './node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'lucide-react':     path.resolve(__dirname, './node_modules/lucide-react'),
      'zustand':          path.resolve(__dirname, './node_modules/zustand'),
      'axios':            path.resolve(__dirname, './node_modules/axios'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  server: {
    port: 5180,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
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
        },
      },
    },
  },
});
