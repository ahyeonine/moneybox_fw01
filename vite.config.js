import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
base: '/moneybox_fw01/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
