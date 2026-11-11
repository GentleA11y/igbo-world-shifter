import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: { port: 3000, host: true },
    preview: { port: 3000, host: true },
    build: {
        rollupOptions: {
            output: {
                // Phaser is large; keep it in its own cacheable chunk.
                manualChunks: { phaser: ['phaser'] },
            },
        },
        chunkSizeWarningLimit: 2000,
    },
});
