
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Esto permite que el código existente que usa process.env.API_KEY funcione
      // sin tener que cambiarlo a import.meta.env.VITE_API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
