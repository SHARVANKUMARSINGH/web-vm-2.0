import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // SWC is 20x faster than Babel
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // SWC-based — compiles JSX in milliseconds, not seconds

    VitePWA({
      registerType: 'autoUpdate',

      // ── DO NOT precache the heavy binaries at build time ──
      // Instead, let the runtimeCaching rules handle them on first load.
      // This avoids Workbox hashing a 23 MB ISO during the build.
      includeAssets: ['favicon.svg'],

      // ── Workbox / Service Worker ───────────────────────
      workbox: {
        maximumFileSizeToCacheInBytes: 50_000_000,

        // Only precache the tiny app shell — NOT the VM binaries
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],

        // The heavy VM files are cached at runtime (on first fetch)
        runtimeCaching: [
          {
            // Cache VM binaries aggressively on first download
            urlPattern: /\.(?:wasm|bin|iso|js)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vm-binary-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:css|html)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-shell',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },

      // ── Web App Manifest ───────────────────────────────
      manifest: {
        name: 'Web VM 2.0',
        short_name: 'WebVM',
        description:
          'Boot a full Linux desktop in your browser — powered by v86.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  // Let Vite know .wasm files are legit assets
  assetsInclude: ['**/*.wasm'],

  build: {
    // ── Speed optimizations for low-power devices ──────
    // Skip source maps (saves ~30% build time)
    sourcemap: false,
    // Use esbuild for minification (faster than terser)
    minify: 'esbuild',
    // Don't report gzip sizes (saves compute)
    reportCompressedSize: false,
    // Raise chunk warning limit (avoids noisy warnings)
    chunkSizeWarningLimit: 1000,
  },

  server: {
    headers: {
      // Required for SharedArrayBuffer (v86 performance)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
