import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/chat': { target, changeOrigin: true },
        '/job_status': { target, changeOrigin: true },
        '/chunking': { target, changeOrigin: true },
        '/chunking/status': { target, changeOrigin: true },
      },
    },
  }
})
