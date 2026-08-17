import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

const API_TARGET = "https://api-mashena.wasta-jobs.com";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // All /api/* HTTP requests → backend (cookies work same-origin)
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Strip SameSite=Lax/Secure so cookies are accepted on localhost
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              proxyRes.headers["set-cookie"] = setCookie.map((c) =>
                c.replace(/;\s*SameSite=\w+/gi, "").replace(/;\s*Secure/gi, "")
              );
            }
          });
        },
      },
      // Socket.IO WebSocket + polling → backend
      // ws:true enables the WebSocket upgrade proxy.
      // Cookies stored for localhost are forwarded by the proxy to the backend.
      "/socket.io": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-tanstack': ['@tanstack/react-query', '@tanstack/react-table'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})

