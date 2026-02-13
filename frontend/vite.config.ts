import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // permite acesso na rede local (ex: http://192.168.x.x:3004)
    port: 3004,
    // HMR: quando acedido via IP, o WebSocket deve usar o mesmo host (evita ws://127.0.0.1)
    hmr: process.env.VITE_HMR_HOST
      ? { host: process.env.VITE_HMR_HOST, port: 3004 }
      : undefined,
    proxy: {
      // Optional: proxy API to backend during dev to avoid CORS
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        configure: (proxy) => {
          // Corrigir cookies quando acedido via IP na rede local: o backend pode definir
          // domain=localhost; remover/ajustar para o host real (ex: 192.168.1.233)
          proxy.on('proxyRes', (proxyRes, req) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (!cookies) return;
            const requestHost = req.headers.host?.split(':')[0] || '';
            const isLocalNetworkIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(requestHost);
            if (!isLocalNetworkIP) return;
            proxyRes.headers['set-cookie'] = cookies.map((cookie: string) =>
              cookie
                .replace(/;\s*Secure/gi, '')
                .replace(/;\s*Domain=[^;]+/gi, ''),
            );
          });
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
