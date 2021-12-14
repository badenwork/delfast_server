// vite.config.js
import { defineConfig } from 'vite'
export default defineConfig({
    // config options
    build: {
        sourcemap: true,
        // Reduce bloat from legacy polyfills.
        target: 'esnext',
        // Leave minification up to applications.
        minify: false,
    }
});
