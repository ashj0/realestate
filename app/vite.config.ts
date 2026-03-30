import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['nemoclawvm.tail5df9d8.ts.net'],
    proxy: {
      '/estimate': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/api/estimate': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/property-autocomplete': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/api/property-autocomplete': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/health': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
