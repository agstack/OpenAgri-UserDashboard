import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    // allow cloudflared/ngrok tunnel hosts for mobile PWA testing
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
  },
  plugins: [react(), tsconfigPaths(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      id: '/',
      name: 'OpenAgri-UserDashboard',
      short_name: 'OAUserDash',
      description: 'Dashboard for all OpenAgri services',
      theme_color: '#558bc9',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      screenshots: [
        {
          src: 'screenshot-wide.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'OpenAgri UserDashboard',
        },
        {
          src: 'screenshot-mobile.png',
          sizes: '720x1280',
          type: 'image/png',
          label: 'OpenAgri UserDashboard',
        },
      ],
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf,otf}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      // also make sure it's not pre-cached
      globIgnores: ['**/env-config.js'],
      navigateFallbackDenylist: [/^\/examples\//, /\.pdf$/],
      // NEVER cache the runtime env file
      runtimeCaching: [
        {
          urlPattern: /\/env-config\.js$/,
          handler: 'NetworkOnly', // or 'NetworkFirst' with low cache
        },
        {
          urlPattern: /^\/examples\//,
          handler: 'NetworkOnly',
        },
        {
          urlPattern: ({ request }) =>
            request.method === 'GET' &&
            /\/proxy\/(farmcalendar\/api\/v1\/FarmCalendarActivityTypes\/|pdm\/api\/v1\/(crop|disease|model|threat-model)\/?)/.test(request.url),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'oa-reference',
            expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
          },
        },
        {
          urlPattern: ({ request }) =>
            request.method === 'GET' &&
            (/\/proxy\/farmcalendar\/api\/v1\/(Farm|FarmParcels|FarmAnimals|AgriculturalMachines|Pesticides|Fertilizers)\//.test(request.url)
              || /\/me\/?(\?|$)/.test(request.url)),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'oa-user-semi',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
          },
        },
        {
          urlPattern: ({ request }) =>
            request.method === 'GET' &&
            /\/proxy\/(farmcalendar\/api\/v1\/(FarmCalendarActivities|Observations|Alerts|CompostOperations|IrrigationOperations)\/|irrigation\/api\/v1\/(dataset|eto\/get-calculations)\/)/.test(request.url),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'oa-user-live',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
          },
        },
        {
          urlPattern: ({ request }) =>
            request.method === 'GET' &&
            /\/proxy\/(weather_data\/api\/data\/(forecast5|flight-forecast5|spray-forecast)\/?|pdm\/api\/v1\/risk-forecast)/.test(request.url),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'oa-forecast-v2',
            networkTimeoutSeconds: 5,
            // long maxAge: cache is offline fallback only, online always refetches
            expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
          },
        },
      ],

    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  }),
    // {
    //   name: 'inject-env-config',
    //   transformIndexHtml(html, ctx) {
    //     if (ctx.bundle) {
    //       return html.replace(
    //         '</head>',
    //         '  <script src="/env-config.js"></script>\n</head>'
    //       )
    //     }
    //   },
    // }
  ],
})