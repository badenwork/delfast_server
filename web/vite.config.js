// vite.config.js
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    // optimizeDeps: {
	// 	exclude: [ "@fortawesome/fontawesome-free" ]
	// },
    // config options
    build: {
        sourcemap: true,
        // Reduce bloat from legacy polyfills.
        target: 'esnext',
        // Leave minification up to applications.
        minify: false,
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            // registerType: 'prompt',
            workbox: {
              cleanupOutdatedCaches: true,
            //   sourcemap: true
            }
/*            strategies: 'injectManifest',
            workbox: {
                cleanupOutdatedCaches: false,
                sourcemap: true
            }*/
        })
    ]
});
