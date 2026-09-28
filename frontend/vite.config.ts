import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      "/api": {
        // Em desenvolvimento local (`npm run dev` fora do Docker), o backend
        // roda em http://localhost:5000. Dentro do docker-compose, o serviço
        // "web" recebe VITE_API_PROXY_TARGET=http://api:5000 (nome do
        // serviço na rede interna do Compose) — ver docker-compose.yml.
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
