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
      // Force shared-ui source files to resolve peer deps from hub/node_modules
      // (Vite 8 / rolldown resolves from source file location, not importer)
      'react':            path.resolve(__dirname, './node_modules/react'),
      'react-dom':        path.resolve(__dirname, './node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'lucide-react':     path.resolve(__dirname, './node_modules/lucide-react'),
      'zustand':          path.resolve(__dirname, './node_modules/zustand'),
      'axios':            path.resolve(__dirname, './node_modules/axios'),
      'yup':              path.resolve(__dirname, './node_modules/yup'),
      'socket.io-client': path.resolve(__dirname, './node_modules/socket.io-client'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  // ─── IMPORTANT cho Capacitor ─────────────────────────────────────────────────
  // base: './' cho phép Capacitor WebView load assets với đường dẫn tương đối
  // Khi chạy `npm run dev` bình thường → base tự động là '/'
  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',

  server: {
    port: 5173,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads':   { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },

  build: {
    outDir: 'dist',
    // Tối ưu bundle size cho mobile (tăng warning threshold)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Code splitting thủ công để giảm chunk size (Vite 8: must be a function)
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('lucide-react')) return 'ui-vendor';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-vendor';
        },
      },
    },
  },
});
