import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo_new.png', 'icon-192.png', 'icon-512.png', 'screenshot-desktop.png', 'screenshot-mobile.png'],
        manifestFilename: 'manifest.json',
        manifest: {
          id: 'com.cfm.mobile.app.v1',
          name: 'CFM Mobile - Controle Financeiro',
          short_name: 'CFM Mobile',
          description: 'Aplicação de Controle Financeiro Mensal (CFM) com suporte offline, sincronização em nuvem e interface intuitiva para gestão de gastos e ganhos.',
          lang: 'pt-BR',
          theme_color: '#2c3e50',
          background_color: '#ffffff',
          display: 'standalone',
          // @ts-ignore
          display_override: ['window-controls-overlay', 'tabbed', 'standalone', 'minimal-ui'],
          orientation: 'portrait',
          dir: 'ltr',
          scope: '/',
          start_url: '/',
          prefer_related_applications: false,
          related_applications: [
            {
              platform: "play",
              url: "https://play.google.com/store/apps/details?id=com.cfm.mobile.app",
              id: "com.cfm.mobile.app"
            }
          ],
          iarc_rating_id: "700e-450a-4a2a-7b3b",
          categories: ['finance', 'productivity'],
          file_handlers: [
            {
              action: "/",
              accept: {
                "text/plain": [".txt"],
                "application/json": [".json"]
              }
            }
          ],
          protocol_handlers: [
            {
              protocol: "web+cfm",
              url: "/?url=%s"
            }
          ],
          launch_handler: {
            client_mode: ["focus-existing", "auto"]
          },
          edge_side_panel: {
            preferred_width: 480
          },
          widgets: [
            {
              name: "Resumo CFM",
              description: "Acompanhe seu saldo mensal",
              tag: "finances",
              template: "widget-template",
              ms_ac_template: {
                type: "AdaptiveCard",
                body: [
                  {
                    type: "TextBlock",
                    text: "Saldo Atual: R$ 0,00"
                  }
                ]
              },
              data: "/",
              type: "application/json",
              screenshots: [
                {
                  src: "icon-512.png",
                  sizes: "512x512",
                  type: "image/png"
                }
              ],
              icons: [
                {
                  src: "icon-192.png",
                  sizes: "192x192",
                  type: "image/png"
                }
              ]
            }
          ],
          share_target: {
            action: "/?share=true",
            method: "GET",
            params: {
              title: "title",
              text: "text",
              url: "url"
            }
          },
          scope_extensions: [
            { origin: "ais-pre-adl7juw25kevfnjr5wlvye-276952856521.us-west1.run.app" }
          ],
          note_taking: {
            new_note_url: "/?action=new-note"
          },
          screenshots: [
            {
              src: 'screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'CFM Mobile no Desktop'
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'CFM Mobile no Celular'
            }
          ],
          shortcuts: [
            {
              name: 'Nova Saída',
              short_name: 'Saída',
              description: 'Registrar um novo gasto',
              url: '/?tab=EXPENSE',
              icons: [{ src: 'icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'Nova Entrada',
              short_name: 'Entrada',
              description: 'Registrar um novo ganho',
              url: '/?tab=INCOME',
              icons: [{ src: 'icon-192.png', sizes: '192x192' }]
            }
          ],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': 'react-native-web'
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
