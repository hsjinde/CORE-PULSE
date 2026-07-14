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
  define: {
    // 真實建置時間,供 Footer 的 Built 讀數使用(儀器的誠實:不用訪問日冒充)
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
