import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    cacheDir: '../../node_modules/.vite-cache',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    base: '/',
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
                changeOrigin: true,
            },
            '/public': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom') || id.includes('/node_modules/react-router'))
                        return 'react-vendor';
                    if (id.includes('@tanstack/react-query'))
                        return 'query-vendor';
                    if (id.includes('framer-motion'))
                        return 'motion-vendor';
                    if (id.includes('@radix-ui'))
                        return 'radix-vendor';
                    if (id.includes('lucide-react'))
                        return 'ui-vendor';
                },
            },
        },
    },
});
