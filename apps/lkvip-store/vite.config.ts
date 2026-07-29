import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  cacheDir: '../../node_modules/.vite-cache',
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tailwindcss() as any,
    react(),
    VitePWA({
      strategies:   'injectManifest',
      srcDir:       'src',
      filename:     'sw.ts',
      registerType: 'autoUpdate',
      devOptions:   { enabled: false },
      includeAssets: ['favicon.ico'],
      manifest: {
        name:             'LKVIP Store',
        short_name:       'Store',
        description:      'LKVIP GROUP — Marketplace dịch vụ số & tài nguyên kỹ thuật số',
        theme_color:      '#3b82f6',
        background_color: '#eff6ff',
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
      injectManifest: {
        globPatterns: ['**/*.{js,html,ico,png,svg,woff2}'],
        // Block outer-build plugins from leaking into the internal sw sub-build.
        vitePlugins: [],
        // vite-plugin-pwa v1.3 uses Vite 8 / rolldown internally; setting
        // target to esnext prevents esbuild from trying to downlevel the
        // already-bundled sw.mjs to es2020 targets (which it cannot do).
        target: 'esnext',
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
    port: 5184,
    proxy: {
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads':   { target: 'http://localhost:5000', changeOrigin: true },
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
          if (id.includes('recharts'))              return 'chart-vendor';
          if (id.includes('lucide-react'))           return 'ui-vendor';
        },
      },
    },
  },
});
