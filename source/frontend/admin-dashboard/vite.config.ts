// frontend/admin-dashboard/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@admin':     path.resolve(__dirname, './src'),
      '@ui':        path.resolve(__dirname, '../shared-ui'),
      '@lkvip/types': path.resolve(__dirname, '../../shared-types/src'),
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

  // ── Antd CSS-in-JS (v5+/v6) uses insertionPoint — no postcss import needed ──
  css: {
    preprocessorOptions: {},
  },

  server: {
    port: 5180,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },

  build: {
    outDir:    'dist',
    minify:    'esbuild',
    chunkSizeWarningLimit: 1200,  // antd bundle is larger than lucide
    rollupOptions: {
      treeshake: true,
      output: {
        manualChunks: (id) => {
          // ── Core React ───────────────────────────────────────────────────────
          if (id.includes('/node_modules/react') ||
              id.includes('/node_modules/react-dom') ||
              id.includes('/node_modules/react-router-dom')) return 'react-vendor';
          // ── Ant Design — split core from icons for better caching ────────────
          if (id.includes('@ant-design/icons'))  return 'antd-icons';
          if (id.includes('antd') || id.includes('@ant-design/cssinjs') || id.includes('rc-'))
                                                 return 'antd-vendor';
          // ── Other vendors ────────────────────────────────────────────────────
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('zustand'))               return 'state-vendor';
          if (id.includes('axios'))                 return 'http-vendor';
          if (id.includes('lucide-react'))          return 'lucide-vendor';
          // ── Sub-project module chunks ─────────────────────────────────────────
          if (id.includes('/modules/game'))    return 'chunk-game';
          if (id.includes('/modules/dating'))  return 'chunk-dating';
          if (id.includes('/modules/sports'))  return 'chunk-sports';
          if (id.includes('/modules/trade'))   return 'chunk-trade';
          if (id.includes('/modules/hub'))     return 'chunk-hub';
          if (id.includes('/modules/ops'))     return 'chunk-ops';
        },
      },
    },
  },
});
