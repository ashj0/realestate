import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['nemoclawvm.tail5df9d8.ts.net'],
    proxy: {
      '/estimate': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/estimate': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/property-autocomplete': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/property-autocomplete': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
