import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      // Must be listed before /api/fifa/ — otherwise /api/fifa-media is caught by the FIFA API proxy.
      '/api/fifa-media': {
        target: 'https://digitalhub.fifa.com',
        changeOrigin: true,
        timeout: 30_000,
        rewrite: (path) => path.replace(/^\/api\/fifa-media/, ''),
      },
      // Trailing slash avoids matching /api/fifa-media (prefix collision).
      '/api/fifa/': {
        target: 'https://api.fifa.com/api/v3',
        changeOrigin: true,
        timeout: 30_000,
        rewrite: (path) => path.replace(/^\/api\/fifa/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'notification-badge.png',
        'share-qr.png',
        'wc26-share-logo.svg',
        'sw-notifications.js',
      ],
      manifest: {
        id: '/',
        name: 'Simelabs WC Predictions',
        short_name: 'WC Predict',
        description: 'Simelabs World Cup 2026 prediction league',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Predict now',
            short_name: 'Predict',
            url: '/predict',
            description: 'Open matches waiting for your pick',
          },
          {
            name: 'League glance',
            short_name: 'Glance',
            url: '/widget',
            description: 'Rank and next lock time',
          },
          {
            name: 'Point table',
            short_name: 'Table',
            url: '/leaderboard',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        importScripts: ['sw-notifications.js'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})
