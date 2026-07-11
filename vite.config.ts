import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 綁定所有介面(IPv4 + IPv6),避免 Windows 上 localhost 解析為 127.0.0.1
    // 卻只監聽 [::1] 而出現 ERR_CONNECTION_REFUSED
    host: true,
  },
})
