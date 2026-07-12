import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Proxy removed - using deployed backend at https://pharmacare-api.onrender.com
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
