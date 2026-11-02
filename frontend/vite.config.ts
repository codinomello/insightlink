import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // `@/…` aponta para `src/…` (espelha o "paths" do tsconfig.app.json)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api': {
        // Local (`npm run dev` fora do Docker): backend em http://localhost:5000.
        // No docker-compose o serviço "web" recebe VITE_API_PROXY_TARGET=http://api:5000.
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
