/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/favicon.ico', 'icons/apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Radio',
        short_name: 'Radio',
        description: 'Веб-радиоприёмник в эстетике Braun с живым эквалайзером',
        lang: 'ru',
        // Токен --color-cream. Раньше здесь оставался #f7f5f2 из прежней тёплой
        // палитры — он виден в строке состояния установленного PWA и на
        // splash-экране. Оба значения совпадают с фоном корпуса на мобильном
        // (DeviceShell под sm заливает экран целиком), чтобы при запуске не
        // мигал посторонний цвет.
        theme_color: '#f7f7f7',
        background_color: '#f7f7f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
