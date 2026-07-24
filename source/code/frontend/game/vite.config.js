import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@ui': path.resolve(__dirname, '../shared-ui'),
            '@lkvip/types': path.resolve(__dirname, '../../shared-types/src'),
            // Force peer deps to resolve from game/node_modules (prevents duplicate instances)
            'react': path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
            'zustand': path.resolve(__dirname, './node_modules/zustand'),
            'axios': path.resolve(__dirname, './node_modules/axios'),
        },
        dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    // IMPORTANT for Capacitor WebView (relative asset paths)
    base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',
    server: {
        port: 5174,
        proxy: {
            '/api': { target: 'http://localhost:5000', changeOrigin: true },
            '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
        },
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 800,
        // Minify with esbuild (fastest, default in Vite 5+)
        minify: 'esbuild',
        rollupOptions: {
            treeshake: true,
            output: {
                // Manual chunk splitting — keeps initial load small
                manualChunks: (id) => {
                    if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router-dom'))
                        return 'react-vendor';
                    if (id.includes('@tanstack/react-query'))
                        return 'query-vendor';
                    if (id.includes('lucide-react'))
                        return 'ui-vendor';
                    if (id.includes('framer-motion'))
                        return 'motion-vendor';
                    if (id.includes('recharts'))
                        return 'charts-vendor';
                    if (id.includes('@tanstack/react-table'))
                        return 'table-vendor';
                    if (id.includes('socket.io-client'))
                        return 'socket-vendor';
                    if (id.includes('shared-types'))
                        return 'types-vendor';
                },
            },
        },
    },
});
