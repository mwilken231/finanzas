import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/auth': 'http://localhost:8000',
      '/categories': 'http://localhost:8000',
      '/transactions': 'http://localhost:8000',
      '/plans': 'http://localhost:8000',
      '/cards': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/backup': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    }
  }
})
