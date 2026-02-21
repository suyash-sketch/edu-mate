import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/chunking': 'http://127.0.0.1:8000',
      '/chat': 'http://127.0.0.1:8000',
      '/job_status': 'http://127.0.0.1:8000',
    }
  }
})
