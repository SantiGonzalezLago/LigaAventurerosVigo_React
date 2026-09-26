import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'Liga de Aventureros de Vigo',
        short_name: 'Liga de Aventureros',
        description: 'Plataforma de la Liga de Aventureros de Vigo',
        lang: 'es',
        start_url: '.',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '256x256 128x128 64x64 48x48 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'logo192.png',
            type: 'image/png',
            sizes: '192x192'
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512'
          }
        ]
      }
    })
  ],
})
