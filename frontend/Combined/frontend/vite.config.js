import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Optional: Change to 3000 for consistency with previous setup
    open: true, // Automatically open browser on dev start
    proxy: {
      '/api': {
        target: 'http://localhost:9487', // Proxy API requests to backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});