import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/qr-scanner/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
